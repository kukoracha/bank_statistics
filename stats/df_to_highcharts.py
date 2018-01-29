from functools import reduce
from operator import concat
from collections import OrderedDict
from itertools import product, cycle
from pandas.core.indexing import IndexingError

class DfToHighcharts():
    """
        Transform DataFrame to Highcharts for BankStatistics
        type 1: groupRegion and groupDate and onlyYear
        type 2: groupRegion and groupDate and not onlyYear
        type 3: groupRegion and not groupDate and onlyYear
        type 4: not groupRegion and  groupDate and onlyYear
        type 5: groupRegion and not groupDate and not onlyYear
        type 6: not groupRegion and not groupDate and onlyYear
        type 7: not groupRegion and groupDate and not onlyYear
    """
    _dictMonth = {
        1: 'Январь', 2: 'Февраль', 3: 'Март',
        4: 'Апрель', 5: 'Май', 6: 'Июнь',
        7: 'Июль', 8: 'Август', 9: 'Сентябрь',
        10: 'Октябрь', 11: 'Ноябрь', 12: 'Декабрь',
    }

    _colors = ['#ff8a65', '#81c784', '#4fc3f7', '#e57373', '#ba68c8', '#f06292', '#7986cb', '#009688', '#aed581', '##64b5f6']

    def __init__(self, valueList):
        self.valueList = valueList

    def _getNameByRegion(self, allRegion, region):
        return 'Забайкальский край' if allRegion else ', '.join(region.values())
    def _getDateWithRange(self, isRange, listDate):
        years = sorted(listDate.keys())
        if (isRange):
            return "C {} г. по {} г.".format(years[0], years[-1])
        else:
            return ', '.join(map(lambda y: '{} г.'.format(y), years))
    def _getCategoriesPath(self, selectors1, selectors2, key=None):
        categoriesPath = {}
        for sel1, sel2 in product(selectors1, selectors2):
            k = sel1 if key is None else key(sel1)
            if (k not in categoriesPath):
                categoriesPath[k] = []
            path = []
            if isinstance(sel1, tuple):
                path.extend(sel1)
            else:
                path.append(sel1)
            if isinstance(sel2, tuple):
                path.extend(sel2)
            else:
                path.append(sel2)
            categoriesPath[k].append(tuple(path))
        return categoriesPath

    def _getSeries(self, parent_id, field, iter):
        series = []
        colors = cycle(self._colors)
        for fd in field:
            data = []
            for i in iter:
                loc = [parent_id, fd.id]
                if isinstance(i, tuple):
                    loc.extend(i)
                elif isinstance(i, int):
                    loc.append(i)
                try:
                    value = self.valueList.loc[tuple(loc)].round(2)
                except:
                    value = None
                data.append(value)
            series.append({'name': fd.name, 'data': data, 'color': next(colors)})
        return series

    def getParamsType1(self, f, region):
        name = self._getNameByRegion(f['region']['allRegion'], region)
        categories = [self._getDateWithRange(f['date']['isRange'], f['date']['listDate'])]
        return {'name': name, 'categories': categories, 'categoriesPath': [tuple()]}

    def getParamsType2(self, f, region):
        name = self._getNameByRegion(f['region']['allRegion'], region)
        name += "</br>"+self._getDateWithRange(f['date']['isRange'], f['date']['listDate'])
        month = sorted(set(reduce(concat, (m for m in f['date']['listDate'].values()))))
        return {'name': name, 'categories': list(map(lambda m: self._dictMonth[m], month)), 'categoriesPath': month}

    def getParamsType3(self, f, region):
        name = self._getNameByRegion(f['region']['allRegion'], region)
        year = sorted(set(map(int, f['date']['listDate'].keys())))
        return {'name': name, 'categories': year, 'categoriesPath': year}

    def getParamsType4(self, f, region):
        name = self._getDateWithRange(f['date']['isRange'], f['date']['listDate'])
        region = OrderedDict(sorted(region.items(), key=lambda t: t[1]))
        return {'name': name, 'categories': list(map(lambda r: region[r], region.keys())), 'categoriesPath': list(region.keys())}

    def getParamsType5(self, f, region):
        name = self._getNameByRegion(f['region']['allRegion'], region)
        listDate = OrderedDict(sorted(f['date']['listDate'].items(), key=lambda t: t[0]))
        categoriesPath = [(int(year), m) for year, listMonth in listDate.items()  for m in sorted(listMonth)]
        categories = ["{} {} г.".format(self._dictMonth[m], y)for y, m in categoriesPath]
        return {'name': name, 'categories': categories, 'categoriesPath': categoriesPath}

    def getParamsType6(self, f, region):
        year = sorted(set(map(int, f['date']['listDate'].keys())))
        region = OrderedDict(sorted(region.items(), key=lambda t: t[1]))
        if (f['chart']['selectChart'] == 'd'):
            selectors1 = year
            selectors2 = list(region.keys())
            categories = list(region.values())
            selectorsName = list(map(lambda y: '{} г.'.format(y), year))
        else:
            selectors1 = list(region.keys())
            selectors2 = year
            categories = list(map(lambda y: '{} г.'.format(y), year))
            selectorsName = list(region.values())
        categoriesPath = self._getCategoriesPath(selectors1, selectors2)
        return {'categories': categories, 'categoriesPath': categoriesPath,
                'selectors': selectors1, 'selectorsName': selectorsName, 'multi': True}

    def getParamsType7(self, f, region):
        month = sorted(set(reduce(concat, (m for m in f['date']['listDate'].values()))))
        region = OrderedDict(sorted(region.items(), key=lambda t: t[1]))
        if (f['chart']['selectChart'] == 'd'):
            selectors1 = month
            selectors2 = list(region.keys())
            categories = list(region.values())
            selectorsName = list(map(lambda m: self._dictMonth[m], month))
        else:
            selectors1 = list(region.keys())
            selectors2 = month
            categories = list(map(lambda m: self._dictMonth[m], month))
            selectorsName = list(region.values())
        categoriesPath = self._getCategoriesPath(selectors1, selectors2)
        return {'categories': categories, 'categoriesPath': categoriesPath,
            'selectors': selectors1, 'selectorsName': selectorsName, 'multi': True }

    def getParamsType8(self, f, region):
        month = sorted(set(reduce(concat, (m for m in f['date']['listDate'].values()))))
        indexDate = [(int(y), m) for y, m in product(sorted(f['date']['listDate']), month)]
        region = OrderedDict(sorted(region.items(), key=lambda t: t[1]))
        if (f['chart']['selectChart'] == 'd'):
            selectors1 = indexDate
            selectors2 = list(region.keys())
            categories = list(region.values())
            selectorsName = ['{} {} г.'.format(self._dictMonth[m], y) for y, m in indexDate]
        else:
            selectors1 = list(region.keys())
            selectors2 = indexDate
            categories = ['{} {} г.'.format(self._dictMonth[m], y) for y, m in indexDate]
            selectorsName = list(region.values())
        if (f['chart']['selectChart'] == 'd'):
            tr = lambda k: '{}-{}'.format(k[0], k[1])
        else:
            tr = lambda k: k
        categoriesPath = self._getCategoriesPath(selectors1, selectors2, tr)
        return {'categories': categories, 'categoriesPath': categoriesPath,
                'selectors': list(map(tr,selectors1)), 'selectorsName': selectorsName, 'multi': True}

    def transform(self, parent_id, field, categoriesPath):
        if isinstance(categoriesPath, list):
            series = self._getSeries(parent_id, field, categoriesPath)
        elif isinstance(categoriesPath, dict):
            series = {key: self._getSeries(parent_id, field, path) for key, path in categoriesPath.items()}
        else:
            series = []
        return series
