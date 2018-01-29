from django.http import HttpResponse, JsonResponse
from django.utils.html import escape
from stats.models import Tables, Fields, FieldsFill, FieldsValue, Regions
from django.db.models import Max
from django.db import transaction

import json
from itertools import product, chain
import pandas as pd
from django_pandas.io import read_frame
from .df_to_highcharts import DfToHighcharts

@transaction.atomic
def update_table(request):
    if not request.POST:
        return HttpResponse(status=500)
    table_active = True if request.POST['table_active'] == 'true' else False
    table_id = request.POST['table_id']
    sub = json.loads(request.POST['sub'])
    remove_sub = json.loads(request.POST['remove_sub'])
    if table_id == 'new':
        table_id = Tables.objects.all().aggregate(Max('pk'))['pk__max']
        if table_id is None:
            table_id = 1
        else:
            table_id += 1
    table, created = Tables.objects.update_or_create(
        pk = table_id,
        defaults={
            'name': escape(request.POST['table_name']),
            'is_active': table_active,
        }
    )
    Tables.objects.filter(parent=table, pk__in = remove_sub).delete()
    for s in sub:
        t = Tables() if s['id'] == 'new' else Tables.objects.get(pk=s['id'])
        t.parent = table
        t.name = escape(s['name'])
        t.is_active = s['active']
        t.save()
    return  JsonResponse({
        'created': created,
        'card_id': table.id,
        'data': {
            'name': table.name,
            'is_active': table.is_active,
            'id': table.id,
        },
        'sub': [{
            'id': s.id,
            'name': s.name,
            'is_active': s.is_active,
        } for s in table.tables_set.all()]
    },safe=False)

@transaction.atomic
def update_field(request):
    if not request.POST:
        return HttpResponse(status=500)
    try:
        table = Tables.objects.get(pk=request.POST['table_id'])
    except Tables.DoesNotExist:
        return HttpResponse(status=500)
    chart_active = True if request.POST['chart_active'] == 'true' else False
    chart_id = request.POST['chart_id']
    sub = json.loads(request.POST['sub'])
    remove_sub = json.loads(request.POST['remove_sub'])
    if chart_id == 'new':
        chart_id = Fields.objects.all().aggregate(Max('pk'))['pk__max']
        if chart_id is None:
            chart_id = 1
        else:
            chart_id += 1
    field, created = Fields.objects.update_or_create(
        pk=chart_id,
        defaults={
            'name': escape(request.POST['chart_name']),
            'is_active': chart_active,
            'aggfunc': escape(request.POST['chart_aggregate']),
            'table': table,
        }
    )
    Fields.objects.filter(parent=field, pk__in=remove_sub).delete()
    for s in sub:
        f = Fields() if s['id'] == 'new' else Fields.objects.get(pk=s['id'])
        f.parent = field
        f.table = table
        f.name = escape(s['name'])
        f.is_active = chart_active
        f.save()

    fields_fill = FieldsFill.objects.filter(table=table)
    regions = Regions.objects.all()
    sub = [{
            'id': s.id,
            'name': s.name,
            'is_active': field.is_active,
        } for s in field.fields_set.all()]

    for fill in fields_fill:
        for region, f in product(regions, sub):
            o, created = FieldsValue.objects.get_or_create(
                fields_fill = fill,
                region = region,
                field_id = f['id'],
                defaults = {'value': 0},
            )

    return JsonResponse({
        'created': created,
        'card_id': field.id,
        'data': {
            'name': field.name,
            'id': field.id,
            'is_active': field.is_active,
            'aggfunc': field.aggfunc,
        },
        'sub': sub
    }, safe=False)

@transaction.atomic
def update_fill(request):
    if not request.POST:
        return HttpResponse(status=500)
    fill, created = FieldsFill.objects.get_or_create(
        table_id=request.POST['table_id'],
        year=request.POST['year'],
        month=request.POST['month']
    )
    if (not created):
        return JsonResponse({'created': created}, safe=False)
    fields = Fields.objects.filter(table_id = request.POST['table_id'], parent_id__isnull = False)
    regions = Regions.objects.all()
    fieldsValues = [FieldsValue(field=field, region=region, fields_fill=fill, value=0)
                    for field, region in product(fields, regions)]
    FieldsValue.objects.bulk_create(fieldsValues)
    return JsonResponse({'created': created, 'id': fill.id, 'year': fill.year, 'month': fill.month}, safe=False)

def update_chart_fill(request):
    if not request.POST:
        return HttpResponse(status=500)
    try:
        fields_fill = FieldsFill.objects.get(pk=request.POST['fill_id'])
    except FieldsFill.DoesNotExist:
        return HttpResponse(status=500)
    fieldsValue = json.loads(request.POST['fieldsValue'])
    for region, values in fieldsValue.items():
        for field_id, value in values.items():
            if value['changed']:
                f, created = FieldsValue.objects.update_or_create(
                    fields_fill = fields_fill,
                    field_id = field_id,
                    region_id = region,
                    defaults={
                        'value': value['value']},
                )
    return HttpResponse('ok')

@transaction.atomic
def delete(request):
    if not request.POST:
        return HttpResponse(status=500)
    if request.POST['page'] == 'tables':
        Tables.objects.get(pk = request.POST['id']).delete()
    elif request.POST['page'] == 'fields':
        Fields.objects.get(pk = request.POST['id']).delete()
    elif request.POST['page'] == 'fill':
        FieldsFill.objects.get(pk = request.POST['id']).delete()
    else:
        return HttpResponse(status=500)
    return HttpResponse(request.POST["id"])

def df_to_dict(df):
    if df is None:
        return None
    results = {}
    for indexes, value in df.items():
        for i, index in enumerate(indexes):
            if i == 0:
                if not index in results:
                    results[index] = {}
                nested = results[index]
            elif i == len(indexes) - 1:
                nested[index] = value
            else:
                if not index in nested:
                    nested[index] = {}
                nested = nested[index]
    return results

def get_fields(request):
    if not request.POST:
        return HttpResponse(status=500)
    table_id = int(request.POST['table'])
    fields = Fields.objects.prefetch_related('fields_set').filter(table_id=table_id, is_active=True, parent=None)
    results = {}
    for field in fields:
        items = {i.id : i.name for i in field.fields_set.all()}
        results[field.id] = {
            'label': field.name,
            'items': items,
        }
    return JsonResponse({'status': 0 if len(results)==0 else 1, 'results':results}, safe=False);

def get_stats(request):
    if not request.POST:
        return HttpResponse(status=500)
    filterList = json.loads(request.POST['filterList'])
    fieldsList = json.loads(request.POST['tablesList'])
    fields = Fields.objects.filter(parent__in=fieldsList, table__is_active=True, is_active=True).order_by('parent_id')
    resultFilterList = {}
    regions = Regions.objects.all().order_by('name')
    valueList = FieldsValue.objects.select_related('field', 'field__parent', 'fields_fill', 'region').filter(field__in=fields)
    valueList = valueList.values('id', 'field__id', 'value', 'field__parent_id', 'field__parent__aggfunc',
                                 'fields_fill__month', 'fields_fill__year', 'region__id', 'region__short_name')
    mainValueList = read_frame(valueList, index_col='id')
    for indexFilter, f in filterList.items():
        fi = fields.filter(parent_id__in = fieldsList)
        valueList = mainValueList.copy()
        valueList = valueList[valueList['field__id'].isin(fi.values_list('id', flat=True))]
        group_list = ['field__parent_id', 'field__id']
        where, whereRegion, whereDate = None, None, None
        selectChart = f['chart']['selectChart']
        allRegion = f['region']['allRegion']
        groupRegion = f['region']['groupRegion']
        groupYear = f['date']['groupYear']
        groupMonth = f['date']['groupMonth']
        if not allRegion:
            whereRegion = (valueList['region__id'].isin(f['region']['listRegion']))
        for year, listMonth in f['date']['listDate'].items():
            w = (valueList['fields_fill__year'] == int(year)) & \
                (valueList['fields_fill__month'].isin(listMonth))
            if whereDate is None:
                whereDate = w
            else:
                whereDate |= w
        if whereRegion is not None:
            where = ((whereRegion) & (whereDate))
        else:
            where = whereDate
        valueList = valueList[where]
        groupListRegion, groupListDate  = [], []
        if not groupRegion:
            groupListRegion.append('region__id')
        if not groupYear:
            groupListDate.append('fields_fill__year')
        if not groupMonth:
            groupListDate.append('fields_fill__month')
        if (not groupRegion and (not groupMonth or not groupRegion)) and selectChart == 'd':
            group_list += groupListDate + groupListRegion
        else:
            group_list += groupListRegion + groupListDate
        valueList_s = valueList[valueList.field__parent__aggfunc == 's']
        valueList_a = valueList[valueList.field__parent__aggfunc == 'a']
        valueList = pd.DataFrame()
        concat = []
        if not valueList_s.empty:
            concat.append(valueList_s.groupby(group_list)['value'].sum())
            del valueList_s
        if not valueList_a.empty:
            concat.append(valueList_a.groupby(group_list)['value'].mean())
            del valueList_a
        if len(concat) == 1:
            valueList = concat[0]
        elif len(concat) > 1:
            valueList = pd.concat(concat)
        df = DfToHighcharts(valueList)
        if f['region']['allRegion']:
            region = {r.id: r.name for r in regions}
        else:
            region = {r.id: r.name for r in regions.filter(pk__in=f['region']['listRegion'])}
        if groupRegion and groupYear and groupMonth:
            params = df.getParamsType1(f, region)
        elif groupRegion and groupYear and not groupMonth:
            params = df.getParamsType2(f, region)
        elif groupRegion and not groupYear and groupMonth:
            params = df.getParamsType3(f, region)
        elif not groupRegion and groupYear and groupMonth:
            params = df.getParamsType4(f, region)
        elif groupRegion and not groupYear and not groupMonth:
            params = df.getParamsType5(f, region)
        elif not groupRegion and not groupYear and groupMonth:
            params = df.getParamsType6(f, region)
        elif not groupRegion and groupYear and not groupMonth:
            params = df.getParamsType7(f, region)
        elif not groupRegion and not groupYear and not groupMonth:
            params = df.getParamsType8(f, region)
        if indexFilter not in resultFilterList:
            resultFilterList[indexFilter] = {'listSeries': {}}
            resultFilterList[indexFilter].update(params)
            resultFilterList[indexFilter].pop('categoriesPath', None)
        for iT in fieldsList:
            field = fields.filter(parent=iT)
            resultFilterList[indexFilter]['listSeries'][iT] = df.transform(iT, field, params['categoriesPath'])
    return JsonResponse(resultFilterList, safe=False, json_dumps_params={'default': int})

# Create your views here.
