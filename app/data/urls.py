from django.conf.urls import url
from . import views

urlpatterns = [
    url(
        regex=r'^file/$',
        view=views.LoadFile.as_view(),
        name='file'
    ),
    url(
        regex=r'^loadUserNames/$',
        view=views.LoadUserNames.as_view(),
        name='userNames'
    ),
    url(
        regex=r'^loadUsers/$',
        view=views.LoadUsers.as_view(),
        name='loadUsers'
    ),
    url(
        regex=r'^clusterGroups/$',
        view=views.ClusterGroups.as_view(),
        name='clusterGroups'
    ),
    
]