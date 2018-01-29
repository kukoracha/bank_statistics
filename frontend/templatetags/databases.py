from django import template

register = template.Library()

@register.filter
def getParent(value):
    value = value.filter(parent=None)
    return (v for v in value if v.some_fields)

@register.filter
def getChild(value, parent):
    value = value.filter(parent=parent)
    return (v for v in value if v.some_fields)
