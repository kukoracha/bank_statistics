from django.db import models
from django.utils import timezone
from django.utils.dates import MONTHS

class Regions(models.Model):
  name = models.CharField(max_length=150)
  short_name = models.CharField(unique=True, max_length=15, default=None)
  parent = models.ForeignKey('self', blank = True, null=True)
  class Meta:
    db_table = 'stat_regions'

class Tables(models.Model):
    name = models.CharField(max_length=150)
    parent = models.ForeignKey('self', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'stat_tables'

class Fields(models.Model):
    AGGFUNC_CHOICES = (
        ('s', 'Сумма'),
        ('a', 'Среднее значение'),
    )
    name = models.CharField(max_length=150)
    aggfunc = models.CharField(max_length=1, choices=AGGFUNC_CHOICES)
    table = models.ForeignKey(Tables)
    parent = models.ForeignKey('self', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    @classmethod
    def aggfunc_verbose(cls):
        return Fields.AGGFUNC_CHOICES
    class Meta:
        db_table = 'stat_fields'


class FieldsFill(models.Model):
    table = models.ForeignKey(Tables)
    year = models.PositiveSmallIntegerField(default=timezone.now().year)
    month = models.PositiveSmallIntegerField(choices=MONTHS.items(), default=timezone.now().month)
    class Meta:
        db_table = 'stat_fields_fill'

class FieldsValue(models.Model):
    fields_fill = models.ForeignKey(FieldsFill)
    field = models.ForeignKey(Fields)
    value = models.IntegerField()
    region = models.ForeignKey(Regions, default=None)
    class Meta:
        db_table = 'stat_fields_value'

# Create your models here.
