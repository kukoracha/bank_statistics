from django.conf.urls import url, include
from frontend import views

urlpatterns = [
    url(r'^$', views.frontend, name='frontend'),
]
