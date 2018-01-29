from django.conf.urls import url
from stats import views

urlpatterns = [
    url(r'update_table/$', views.update_table),
    url(r'update_field/$', views.update_field),
    url(r'update_fill/$', views.update_fill),
    url(r'update_chart_fill/$', views.update_chart_fill),
    url(r'delete', views.delete),
    url(r'get_fields/$', views.get_fields),
    url(r'get_stats/$', views.get_stats),
]