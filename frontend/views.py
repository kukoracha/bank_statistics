from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Prefetch
from stats.models import Tables, Fields, FieldsFill, Regions


@ensure_csrf_cookie
def frontend(request):
    regions = Regions.objects.all()
    years = FieldsFill.objects.all().values('year').distinct().order_by('year')
    tables = Tables.objects.prefetch_related(Prefetch('fields_set', queryset=Fields.objects.filter(parent=None, is_active=True), to_attr='some_fields')).filter(is_active=True, ).order_by('parent_id')
    return render(request, 'frontend/frontend.html', context={
        'regions': regions,
        'years': years,
        'databases': tables,
    })

# Create your views here.
