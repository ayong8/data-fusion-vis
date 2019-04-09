from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse, HttpRequest
from rest_framework.request import Request

from config.settings.base import STATIC_ROOT, ROOT_DIR, STATICFILES_DIRS

from tslearn.utils import to_time_series_dataset
from tslearn.clustering import TimeSeriesKMeans
from sklearn.decomposition import PCA

import os
import pandas as pd
import json

data = './data/right_hemi_small_simple.csv'

def open_dataset(file):
  entire_file_path = os.path.join(STATICFILES_DIRS[0], file)
  whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU'))
  whole_dataset_df.set_index('idx')

  return whole_dataset_df

# e.g., total 5000 timepoints => chunk every 100 (t_size), which results in 50 chunks (t_num)
def chunk(df, t_num, t_size):
  chunk_list = []
  for t_idx in range(0, t_num):
    chunk = df.loc[ t_idx*t_size : (t_idx+1)*t_size ]
    chunk_sum = chunk.sum()
    chunk_std = chunk.std()
    chunk_list.append({ 'sum': chunk_sum, 'std': chunk_std })

  return chunk_list

# Save each group information as dataframe
# Output: A list of group dataframes
def group_by_kmeans(df, num_groups):
  kmeans = TimeSeriesKMeans(n_clusters=num_groups, max_iter=5, metric='dtw')
  cluster_membership_list = kmeans.fit_predict(df)
  
  return cluster_membership_list

class LoadFile(APIView):
  def get(self, request, format=None):
    entire_file_path = os.path.join(STATICFILES_DIRS[0], data)
    whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU'))

    return Response(whole_dataset_df.to_json(orient='index'))

class LoadUserNames(APIView):
  def get(self, request, format=None):
    entire_file_path = os.path.join(STATICFILES_DIRS[0], data)
    whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU'))

    return Response(json.dumps(list(whole_dataset_df.columns)))

class LoadUsers(APIView):
  def get(self, request, format=None):
    pass
  
  def post(self, request, format=None):
    json_request = json.loads(request.body.decode(encoding='UTF-8'))
    user_ids = json_request['selectedUsers']
    t_num = json_request['tNum']
    t_size = json_request['tSize']

    whole_dataset_df = open_dataset(data)
    df_selected_users = whole_dataset_df[user_ids]

    user_chunks_dict = {}
    for user_id in user_ids:
      user_chunks = chunk(whole_dataset_df[user_id], t_num, t_size)
      user_chunks_dict[user_id] = user_chunks

    return Response(json.dumps(user_chunks_dict))

class ClusterGroups(APIView):
  def get(self, request, format=None):
    pass

  def post(self, request, format=None):
    json_request = json.loads(request.body.decode(encoding='UTF-8'))
    num_groups = json_request['numGroups']
    group_size = json_request['groupSize']
    t_num = json_request['tNum']
    t_size = json_request['tSize']
    method = json_request['clusteringOption']
    print('in ClusterGroups: ', json_request)

    whole_dataset_df = open_dataset(data)

    clusters = {}

    # Grouping
    groups = []
    columns = list(whole_dataset_df.columns)
    print(columns)
    columns.remove('idx')
    # for group_idx in range(0, num_groups): # For now, just group by index
    #     df_group = whole_dataset_df[ columns[ group_idx*group_size: (group_idx+1)*group_size ] ].sum(axis=1)
    #     groups.append(df_group)
    
    df_for_clustering = whole_dataset_df.drop(['idx'], axis=1).T.values
    print('shape before: ', df_for_clustering.shape)
    pca = PCA(n_components=2)
    df_for_clustering_after_pca = pca.fit_transform(df_for_clustering)
    print('shape after: ', df_for_clustering_after_pca.shape)
    clustering_result = group_by_kmeans(to_time_series_dataset(df_for_clustering_after_pca), num_groups) # row: # of datapoints (=patients), col: # of timepoints

    print(len(columns), len(clustering_result))
    pd_patient_cluster = pd.DataFrame({'patient_id': columns, 'cluster': clustering_result})

    for group_idx in range(0, num_groups):
      patients_in_cluster = pd_patient_cluster[pd_patient_cluster.cluster==group_idx]['patient_id']
      print('patients in cluster: ', patients_in_cluster)
      df_group = whole_dataset_df[patients_in_cluster].sum(axis=1)
      groups.append(df_group)
      print(df_group.head())


    # Chunk by timepoints
    for group_idx, df_group in enumerate(groups):
        clusters[group_idx] = []
        chunk_list = chunk(df_group, t_num, t_size)
        clusters[group_idx] = chunk_list

    return Response(json.dumps(clusters))
