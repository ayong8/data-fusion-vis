from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse, HttpRequest
from rest_framework.request import Request

from config.settings.base import STATIC_ROOT, ROOT_DIR, STATICFILES_DIRS

from tslearn.utils import to_time_series_dataset
from tslearn.clustering import TimeSeriesKMeans
from sklearn.decomposition import PCA

from keras.models import Sequential
from keras.layers import Dense
from keras.layers import LSTM
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import numpy as np
from saxpy.znorm import znorm
from saxpy.paa import paa
from saxpy.sax import ts_to_string
from saxpy.alphabet import cuts_for_asize
from saxpy.hotsax import find_discords_hotsax
from numpy import genfromtxt

import os
import pandas as pd
import json

data = './data/right_hemi_small_simple.csv'
label_data = './data/patient_label.csv'

global_mean = 0
global_std = 0

# (Row: patients) x (column: 5000 timepoints + 2 target labels ('survive', 'follow')) - 'follow' (follow commands?)
def open_dataset(file):
  file_path = os.path.join(STATICFILES_DIRS[0], file)
  whole_dataset_df = pd.read_csv(open(file_path, 'rU'))
  whole_dataset_df.set_index('idx', inplace=True)

  return whole_dataset_df

def sax_transform(pattern, perform_paa, paa_length, alphabet_length):
  dat = pattern
  #dat = znorm(dat)
  dat = (dat - global_mean) / global_std

  if perform_paa:
    dat = paa(dat, paa_length)
  
  sax_string = ts_to_string(dat, cuts_for_asize(alphabet_length))
  
  return sax_string

def find_discords(sax_pattern, threshold):
  sax_chars = list(sax_pattern)
  discord_list = []
  
  for index in range(len(sax_chars)):
    last_index = index + 5

    if(last_index < len(sax_chars)):
      char_window = sax_chars[index:last_index]
      min_char = min(char_window)
      max_char = max(char_window)

      char_diff = abs(ord(max_char) - ord(min_char))
      if char_diff > threshold:
        discord_list.append((index, last_index))
  
  return discord_list

# e.g., total 5000 timepoints => chunk every 100 (t_size), which results in 50 chunks (t_num)
def chunk(df, t_num, t_size):
  chunk_list = []
  for t_idx in range(0, t_num):
    chunk = df.loc[ str(t_idx*t_size) : str((t_idx+1)*t_size) ]
    chunk_mean = chunk.mean()
    chunk_std = chunk.std()
    chunk_sax = sax_transform(chunk, False, 3, 10)

    chunk_list.append({'mean': chunk_mean, 'std': chunk_std, 'outlierIndex': 1, 'chunk_sax': chunk_sax})
  
  #means = np.array([chunk['mean'] for chunk in chunk_list])
  #means_sax = sax_transform(means, False, 3,10)

  return chunk_list

# Save each group information as dataframe
# Output: A list of group dataframes
def group_by_kmeans(df, num_groups):
  kmeans = TimeSeriesKMeans(n_clusters=num_groups, max_iter=5, metric='dtw')
  cluster_membership_list = kmeans.fit_predict(df)
  centroids = kmeans.cluster_centers_
  print('centroids: ', centroids)
  
  return cluster_membership_list

class LoadFile(APIView):
  def get(self, request, format=None):
    entire_file_path = os.path.join(STATICFILES_DIRS[0], data)
    whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU')).set_index('idx')

    return Response(whole_dataset_df.to_json(orient='index'))

class LoadUserNames(APIView):
  def get(self, request, format=None):
    entire_file_path = os.path.join(STATICFILES_DIRS[0], data)
    whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU'))

    return Response(json.dumps(list(whole_dataset_df['idx'])))

class SAXTransform(APIView):
  def get(self, request, format=None):
    pass
  
  def post(self, request, format=None):
    json_request = json.loads(request.body.decode(encoding='UTF-8'))
    selected_pattern = json_request['selectedPattern']
    perform_paa = json_request['performPaa']
    
    transformed = sax_transform(selected_pattern, perform_paa, 3, 10)

    return Response(json.dumps({'transformedString': transformed}))

class LoadUsers(APIView):
  def get(self, request, format=None):
    pass
  
  def post(self, request, format=None):
    json_request = json.loads(request.body.decode(encoding='UTF-8'))
    user_ids = json_request['selectedPatients']
    t_num = json_request['tNum']
    t_size = json_request['tSize']

    whole_dataset_df = open_dataset(data)
    supp_ratio_df = whole_dataset_df.drop(['survive', 'follow'], axis=1)

    global global_mean, global_std
    global_mean = supp_ratio_df.stack().mean()
    global_std =  supp_ratio_df.stack().std()

    user_chunks_dict = {}
    for user_id in user_ids:
      user_chunks = chunk(supp_ratio_df.loc[user_id, :], t_num, t_size)

      user_values = np.array([chunk['mean'] for chunk in user_chunks])
      user_sax = sax_transform(user_values, False, 3,20)

      user = {}
      user['chunks'] = user_chunks
      user['sax'] = user_sax
      user['discord'] = find_discords(user_sax, 5)

      user_chunks_dict[user_id] = user

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

    whole_dataset_df = open_dataset(data)
    supp_ratio_df = whole_dataset_df.drop(['survive', 'follow'], axis=1)
    target_df = whole_dataset_df[['survive', 'follow']]

    # Group by clustering algorithm
    groups_before_sorting = []
    groups_for_target = []
    patient_ids = list(whole_dataset_df.index)
    
    # Obtain representation (dimension reduction)
    df_for_clustering = supp_ratio_df.values
    pca = PCA(n_components=2)
    df_for_clustering_after_pca = pca.fit_transform(df_for_clustering)
    print('df_for_clustering_after_pca: ', df_for_clustering_after_pca)
    clustering_result = group_by_kmeans(to_time_series_dataset(df_for_clustering_after_pca), num_groups) # row: # of datapoints (=patients), col: # of timepoints
    pd_patient_cluster = pd.DataFrame({'patient_id': patient_ids, 'cluster': clustering_result})

    # Store patient information per group in a dataframe, then get the list of dataframes
    for group_idx in range(0, num_groups):
      patients_in_cluster = pd_patient_cluster[pd_patient_cluster.cluster==group_idx]['patient_id']
      df_group = supp_ratio_df.loc[patients_in_cluster, :].mean(axis=0)  # Get the mean

      # Target info summary
      group_stat = {}
      group_stat['group'] = group_idx
      group_stat['count'] = len(patients_in_cluster)
      group_stat['survive'] = 1- target_df.loc[patients_in_cluster, 'survive'].value_counts(normalize=True).tolist()[0] # Proportion who survived
      group_stat['follow'] = 1- target_df.loc[patients_in_cluster, 'follow'].value_counts(normalize=True).tolist()[0]
      groups_for_target.append(group_stat)
      groups_before_sorting.append(df_group)

    # Order group by survival rate
    groups_for_target.sort(key = lambda i: (i['survive']))
    groups = []
    group_rankings = [ group['group'] for group in groups_for_target ] # idx is ranking
    for idx, ranking in enumerate(group_rankings):
      groups.append(groups_before_sorting[ranking])

    # Chunk by timepoints
    clusters = {}
    clusters_sax = {}
    group_discords = {}
    for group_idx, df_group in enumerate(groups):  # Go over each group dataframe
        clusters[group_idx] = []
        chunk_list = chunk(df_group, t_num, t_size)  # df_group = (row = # of timepoints, column = 1 (sum))
        clusters[group_idx] = chunk_list

        group_values = np.array([chunk['mean'] for chunk in chunk_list])
        group_sax = sax_transform(group_values, False, 3,20)

        clusters_sax[group_idx] = group_sax
        group_discords[group_idx] = find_discords(group_sax, 2)

    df_for_dim_reduction_plot = pd.concat([pd.DataFrame(df_for_clustering_after_pca, columns=['x', 'y']), pd.DataFrame(clustering_result, columns=['cluster'])], axis=1)  # Merge pca result and clustering result

    return Response(json.dumps({'groupData': {'stat': groups_for_target, 'groups': clusters, 'groupsSax': clusters_sax, 'groupDiscords':group_discords}, 'dimReductions': df_for_dim_reduction_plot.to_json(orient='records')}))
  
class Predict(APIView):
  def get(self, request, format=None):
    pass

  def post(self, request, format=None):
    # create and fit the LSTM network
    model = Sequential()
    model.add(LSTM(4, input_shape=(1, look_back)))
    model.add(Dense(1))
    model.compile(loss='mean_squared_error', optimizer='adam')
    model.fit(trainX, trainY, epochs=100, batch_size=1, verbose=2) 