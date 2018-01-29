from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.utils.html import escape
from django.contrib import auth
from django.urls import reverse
from stats.models import Tables, Fields, FieldsFill, FieldsValue, Regions

@login_required
def admin(request):
    tables = Tables.objects.prefetch_related('tables_set').filter(parent=None)
    return render(request, 'admin/tables.html', context={
        'tables': tables,
    })

@login_required
def chart(request, table_id):
    table = get_object_or_404(Tables, pk=table_id)
    fields = Fields.objects.prefetch_related('fields_set').filter(table=table, parent=None)
    return render(request, 'admin/chart.html', context={
        'agg_choices': Fields.aggfunc_verbose(),
        'table': table,
        'fields': fields,
    })

@login_required
def fill(request, table_id):
    table = get_object_or_404(Tables, pk=table_id)
    fill = FieldsFill.objects.filter(table=table).order_by('-year', 'month')
    return render(request, 'admin/fill.html', context={
        'fieldFill': fill,
        'table': table,
    })

@login_required
def chart_fill(request, table_id, year, month):
    fill = get_object_or_404(FieldsFill, table_id=table_id, year=year, month=month)
    fieldsValue = FieldsValue.objects.filter(fields_fill = fill).order_by('region')
    fields = Fields.objects.prefetch_related('fields_set').filter(table_id=table_id, parent=None)
    regions = Regions.objects.all()
    return render(request, 'admin/chart_fill.html', context={
        'fieldsValue': fieldsValue,
        'fields': fields,
        'regions': regions,
        'fill': fill,
    })

def login(request):
    if request.user.is_authenticated:
        return redirect(admin)
    return render(request, 'admin/login.html')

def logout(request):
    auth.logout(request)
    return redirect(login)

def authenticate(request):
    if not request.POST:
        return HttpResponse(status=500)
    login = escape(request.POST['login'])
    password = escape(request.POST['password'])
    next = escape(request.POST['next'])

    try:
        next = request.build_absolute_uri(reverse(next))
    except:
        next = request.build_absolute_uri(reverse('admin'))
    user = auth.authenticate(username = login, password = password)
    result = {'next': next, 'status': False}
    if user is not None:
        if user.is_active:
            auth.login(request, user)
            result['status'] = True
    return JsonResponse(result, safe=False)
# Create your views here.
