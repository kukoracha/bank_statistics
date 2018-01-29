from django.conf.urls import url, include
from administrator import views

urlpatterns = [
    url(r'^login/', views.login, name='login'),
    url(r'^logout/', views.logout, name='logout'),
    url(r'^authenticate/', views.authenticate, name='authenticate'),
    url(r'^fill/(?P<table_id>[0-9]+)/date/(?P<year>[0-9]{4})/(?P<month>[0-9]{1,2})/$', views.chart_fill, name='chart_fill'),
    url(r'^fill/(?P<table_id>[0-9]+)/$', views.fill, name='fill'),
    url(r'^chart/(?P<table_id>[0-9]+)/$', views.chart, name='chart'),
    url(r'^$', views.admin, name='admin'),


    #url(r'^edit_tables/', views.get_tables)
]
