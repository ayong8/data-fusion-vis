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
        regex=r'^loadMotifsAndSegmentsFile/$',
        view=views.LoadMotifsAndSegmentsFile.as_view(),
        name='loadMotifsAndSegmentsFile'
    ),
    url(
        regex=r'^loadUsers/$',
        view=views.LoadUsers.as_view(),
        name='loadUsers'
    ),
    url(
        regex=r'^loadSomeUsers/$',
        view=views.LoadSomeUsers.as_view(),
        name='loadSomeUsers'
    ),
    url(
        regex=r'^clusterGroups/$',
        view=views.ClusterGroups.as_view(),
        name='clusterGroups'
    ),
    url(
        regex=r'^saxTransform/$',
        view=views.SAXTransform.as_view(),
        name='saxTransform'
    )
    
]