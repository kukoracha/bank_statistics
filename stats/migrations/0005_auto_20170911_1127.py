# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-09-11 02:27
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0004_auto_20170911_1102'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='fieldsvalue',
            name='region',
        ),
        migrations.AddField(
            model_name='fieldsfill',
            name='region',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to='stats.Regions'),
        ),
    ]
