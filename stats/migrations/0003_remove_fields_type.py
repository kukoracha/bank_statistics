# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-09-06 06:38
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0002_fields_is_active'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='fields',
            name='type',
        ),
    ]
