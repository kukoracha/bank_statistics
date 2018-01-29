Array.prototype.getUnique = function() {
 var o = {}, a = [], i, e;
 for (i = 0; e = this[i]; i++) {o[e] = 1};
 for (e in o) {a.push (parseInt(e))};
 return a;
}

function s2ab(s) {
	if(typeof ArrayBuffer !== 'undefined') {
		var buf = new ArrayBuffer(s.length);
		var view = new Uint8Array(buf);
		for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
		return buf;
	} else {
		var buf = new Array(s.length);
		for (var i=0; i!=s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
		return buf;
	}
}


function show_toast(msg){
    var toastContent = $('<span>'+msg+'</span>').add($('<button class="btn-flat toast-action"><i class="material-icons">close</i></button>'));
    Materialize.toast(toastContent, 8000);
    $("#toast-container .toast").on("click", function(){
        $(this).fadeOut();
    })
}

function compareNumber(a,b){
    return a > b ? 1 : a < b ? -1 : 0;
}

$(document).ready(function(){
    var table = $.cookie("table"), dataList = {}, filterList = $.cookie("filterList");
    var monthList = {
        1: 'Январь', 2: 'Февраль', 3: 'Март', 4: 'Апрель', 5: 'Май', 6: 'Июнь',
        7: 'Июль', 8: 'Август', 9: 'Сентябрь', 10: 'Октябрь', 11: 'Ноябрь', 12: 'Декабрь',
    };
    if (table === undefined){
        table = $(".element:first", "#slide-out").data("id");
        $.cookie("table", table)
    }
    if (filterList === undefined) {
        filterList = {};
    } else {
        filterList = JSON.parse(filterList);
    }

    function append_filter_to_create(filterId){
        var filters = {};
        var modal = $("#modal-create-report");
        var appendText = "";
        if (Object.keys(filterList).length===0){
            $(".empty", modal).show();
            $(".filters-list", modal).hide();
            return;
        }
        $(".empty", modal).hide();
        $(".filters-list", modal).show();
        if (filterId===undefined) {
            filters = filterList;
        } else {
            filters[filterId] = filterList[filterId];
        }
        $.each(filters, function(i, f){
            appendText += '<div data-id="'+i+'" class="filters d-flex"><a class="filterInfo transparent z-depth-0 btn-floating waves-effect"><i class="material-icons grey-text text-darken-3">info_outline</i></a><div data-id="'+i+'" class="input-checked"><input type="checkbox" class="filterReport" id="filterReport-'+i+'" data-id="'+i+'"/><label for="filterReport-'+i+'">'+f.title+'</label></div></div>';
        });
        $(".filters-list", modal).append(appendText);
        $(".filters-list input[type='checkbox']", modal).on("change", function(){
            $(".error-filters", modal).hide();
        })
        $(".filters-list .filterInfo", modal).off("click").on("click", function(){
           renderFilterInfo($(this).parent().data("id"));
        });
    }
    append_filter_to_create();
    function get_start_end_date(fakeDate, groupMonth){
        var years = Object.keys(fakeDate).sort(compareNumber)
        var startYear = parseInt(years[0]);
        var endYear = parseInt(years[years.length-1]);
        if (groupMonth) {
            return {'start': {'year': startYear, 'month': 0}, 'end': {'year': endYear, 'month': 0},};
        } else {
            var startMonth = fakeDate[startYear].sort(compareNumber)[0];
            var endMonth = fakeDate[endYear].sort(compareNumber)[fakeDate[endYear].length-1];
            return {'start': {'year': startYear, 'month': startMonth}, 'end': {'year': endYear, 'month': endMonth},};
        }
    }
    function get_chips_date_range(type, year, month){
        if (year === -1) return "<div data-type='"+type+"' data-year='-1' class='chip-custom range'>Выберите дату</div>";
        var only_year = "<div data-type='"+type+"' data-year='"+year+"' class='chip-custom selected range'>"+year+" год</div>";
        var with_month = "<div data-type='"+type+"' data-year='"+year+"' data-month='"+month+"' class='chip-custom selected range'>"+monthList[month]+" "+year+" года</div>";
        if (month === undefined || month === 0) {return only_year;} else {return with_month;}
    }
    function isSelected (r, y, m) {
        return r || (y && m);
    }
    function setPropertyFilter(filterId){
        var modal = $("#form-modal-filter-add");
        var filter = filterList[filterId]
        $("#filterName+label", modal).addClass("active");
        if (filter === undefined) {
            console.log(filterList);
            filterId = Math.max.apply(null, Object.keys(filterList))+1
            $("#filterId", modal).val(filterId);
            $("#filterName", modal).val("Фильтр "+filterId).addClass("valid");
            return;
        }
        $("#filterId", modal).val(filterId);
        $("#filterName", modal).val(filter.title);
        $("#groupRegion", modal).prop("checked", filter.region.groupRegion);
        $("#allRegion", modal).prop("checked", filter.region.allRegion).trigger("change");
        $("#groupYear", modal).prop("checked", filter.date.groupYear);
        $("#groupMonth", modal).prop("checked", filter.date.groupMonth).trigger("change");
        $("#isRange", modal).prop("checked", filter.date.isRange).trigger("change");
        for (i in filter.region.listRegion){
            $(".region-selected input[type='checkbox'][data-id='"+filter.region.listRegion[i]+"']").prop("checked", true);
        }
        $("select", "#form-modal-filter-add").material_select("destroy");
        if (filter.date.isRange){
            var fakeDate = get_start_end_date(filter.date.listDate, filter.date.groupMonth);
            $("#getDateYearStart", modal).val(fakeDate.start.year);
            $("#getDateMonthStart", modal).val(fakeDate.start.month);
            $("#getDateYearEnd", modal).val(fakeDate.end.year);
            $("#getDateMonthEnd", modal).val(fakeDate.end.month);
        } else {
            renderListDate(filter.date.listDate, filter.date.groupMonth, true, $(".listDate", modal));
        }
        if (!isSelected(filter.region.groupRegion, filter.date.groupYear, filter.date.groupMonth)){
            $("#selectChart option", modal).attr('selected', false);
            $("#selectChart", modal).find('option[value="'+filter.chart.selectChart+'"]').attr('selected', true);
        }
        $("select", "#form-modal-filter-add").material_select();
    }
    function renderFilterInfo(filterId){
        var filter = filterList[filterId];
        if (filter === undefined) { return; }
        var appendText = "", filterRegion = "", filterDate = "", filterChart = "";
        filterRegion += filter.region.groupRegion ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по регионам</div>' : '';
        if (filter.region.allRegion) {
                filterRegion += '<div class="fake-checked"><i class="material-icons">done</i>Все регионы Забайкальского края</div>';
        } else {
            filterRegion += filter.region.listRegion.reduce(function(s, r){
                return s + '<div class="chip-custom">'+regions[r].name+'</div>';
            }, "");
        }
        filterDate += filter.date.groupYear ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по годам</div>' : '';
        filterDate += filter.date.groupMonth ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по месяцам</div>' : '';
        if (!filter.date.isRange) {
            filterDate += renderListDate(filter.date.listDate, filter.date.groupMonth, false);
        } else {
            var fakeDate = get_start_end_date(filter.date.listDate, filter.date.groupMonth);
            console.log(fakeDate);
            var start = get_chips_date_range("start", fakeDate['start'].year, fakeDate['start'].month);
            var end = get_chips_date_range("end", fakeDate['end'].year, fakeDate['end'].month);
            filterDate += "Диапозон с"+start+" по "+end;
        }
        if (!isSelected(filter.region.groupRegion, filter.date.groupYear, filter.date.groupMonth)){
            filterChart += "Выборка в графике по ";
            filterChart += filter.chart.selectChart==="d" ? "дате" : "региону";
        }
        if (filterRegion.length === 0 && filterDate.length === 0 && filterChart.length === 0){
            return;
        }
        appendText += filterRegion.length !== 0 ? "<div class=title>Регионы</div><div class='content'>"+filterRegion+"</div>" : "";
        appendText += filterDate.length !== 0 ? "<div class=title>Дата</div><div class='content'>"+filterDate+"</div>" : "";
        appendText += filterChart.length !== 0 ? "<div class=title>График</div><div class='content'>"+filterChart+"</div>" : "";
        var modal =  $("#modal-filter-info")
        $(".modal-header", modal).html(filter.title);
        $(".modal-controls", modal).html(appendText);
        $("#modal-filter-info").modal("open");
    }
    function renderFilterList(){
        var modal = $("#modal-filter-list");
        var appendText = '<div class="collection">';
        $.each(filterList, function(i, v){
            appendText += "<div data-id='"+i+"' class='collection-item d-flex space-between'><div class='title d-flex align-center'><a class='filterInfo transparent z-depth-0 btn-floating waves-effect'><i class='material-icons grey-text text-darken-3'>info_outline</i></a>"+v.title+"</div><div class='controls'><a class='filterEdit transparent z-depth-0 btn-floating waves-effect'><i class='material-icons grey-text text-darken-3'>edit</i></a><a class='filterDelete transparent z-depth-0 btn-floating waves-effect'><i class='material-icons grey-text text-darken-3'>delete</i></a></div></div>";
        })
        appendText += '</div>';
        $(".modal-controls", modal).html(appendText);
        $(".modal-controls .filterInfo").on("click", function(){
            renderFilterInfo($(this).closest(".collection-item").data("id"));
        });
        $(".modal-controls .filterEdit").on("click", function(){
            setPropertyFilter($(this).closest(".collection-item").data("id"));
            $("#modal-filter-add").modal("open");
        });
        $(".modal-controls .filterDelete").on("click", function(){
            var parent = $(this).closest(".collection-item");
            var report = $("#modal-create-report");
            var collection = $(".collection", modal);
            $(".filters-list .filters[data-id='"+parent.data("id")+"']", report).remove();
            delete filterList[parent.data("id")]
            delete dataList[parent.data("id")]
            parent.fadeOut(300, function(){$(this).remove();});
            if (Object.keys(filterList).length===0){
                $(".collection", modal).remove();
                $(".empty", report).show();
                $("filters-list", report).hide();
            }
            $.cookie("filterList", JSON.stringify(filterList));
        });
    }
    function renderFilterListChart(){
        var modal = $("#form-modal-filter-add");
        var groupRegion = $("#groupRegion", modal).prop("checked");
        var groupYear = $("#groupYear", modal).prop("checked");
        var groupMonth = $("#groupMonth", modal).prop("checked");
        isSelected(groupRegion, groupYear, groupMonth) ? $(".modal-filter-list-chart", modal).hide() : $(".modal-filter-list-chart", modal).show();
    }
    function renderListDate(listDate, groupYear, isDelete, wrapper){
        var appendText="";
        var deleted = isDelete ? "<i class='close material-icons'>close</i>" : "";
        $.each(listDate, function(year, listMonth){
            if (groupYear) {
                appendText += "<div data-year='"+year+"' class='chip-custom selected'>"+year+" год (сгруппирован)"+deleted+"</div>";
           } else if (listMonth.length === 12) {
                appendText += "<div data-year='"+year+"' class='allMonth chip-custom selected'>"+year+" год (по месецам)"+deleted+"</div>";
           } else {
                appendText += listMonth.reduce(function(s, m){
                    return s+"<div data-year='"+year+"' data-month='"+m+"' class='chip-custom selected'>"+monthList[m]+" "+year+" года"+deleted+"</div>";
                }, "");
           }
        });
        if (isDelete){
             wrapper.html(appendText);
             $(".chip-custom i", wrapper).on("click", function(){
                $(this).parent().remove();
             });
        } else {
            return appendText;
        }
    }
    $(".element[data-id='"+table+"']", "#slide-out").addClass("active");
    $(".element").on("click", function(){
        $(".element").removeClass("active");
        $(this).addClass("active");
        table = $(this).data("id")
        $.cookie("table", table);
    });
    $("#show-filter-list").on("click", function(){
        $("#modal-filter-list").modal("open");
        if (Object.keys(filterList).length===0){
            setPropertyFilter();
            $("#modal-filter-add").modal("open");
        } else {
            renderFilterList();
        }
    });
    $("#add-filterList", "#modal-filter-list").on("click", function(){
        setPropertyFilter();
        $("#modal-filter-add").modal("open");
    });
    $("#add-filterReport", "#modal-create-report").on("click", function(){
        setPropertyFilter();
        $("#modal-filter-add").modal("open");
    });
    function getListDate(){
        var modal = $("#form-modal-filter-add");
        var groupMonth = $("#groupMonth", modal).prop("checked");
        var cDate = {}
        $.each($(".listDate .chip-custom"), function(i, v){
            if (groupMonth || $(this).hasClass("allMonth")) {
                cDate[parseInt($(this).data("year"))] = [1,2,3,4,5,6,7,8,9,10,11,12]
            } else {
                if (cDate[parseInt($(this).data("year"))] === undefined) {
                    cDate[parseInt($(this).data("year"))] = []
                }
                if ($(this).data("month") !== undefined) {
                    cDate[parseInt($(this).data("year"))].push(parseInt($(this).data("month")))
                }
            }
        });
        return cDate
    }
    function load_data(loadData){
         $("#loader").modal("open");
         var sendFilter = {}, sendTables = [], contentChart = $("#charts", "#frontend");
         $.each(loadData, function(database_id, database){
            $.each(database, function(filter_id, tables){
                sendFilter[filter_id] = filterList[filter_id];
                sendTables = sendTables.concat(tables)
            })
         });
         $.ajax({
            type: "POST",
            url: "/statistics/get_stats/",
            data: {
                csrfmiddlewaretoken : $.cookie('csrftoken'),
                filterList: JSON.stringify(sendFilter),
                tablesList: JSON.stringify(sendTables),
            },
            success: function(data){
                dataList = data;
                render(loadData);
                //create_block_for_chart(loadData);
            },
            complete: function(){
                console.log('complete');
                $("#loader").modal("close");
            },
            error: function(){
                show_toast('Произошла ошибка при загрузке данных.<br/>Обновите страницу или попробуйте позже!');
            }
        });
    }
    $("#addDate", "#form-modal-filter-add").on("click", function(){
        var modal = $("#form-modal-filter-add");
        var year = $("#getDateYear", modal).val();
        var month = $("#getDateMonth", modal).val();
        var groupMonth = $("#groupMonth", modal).prop("checked");
        var cDate = getListDate()
        if (year===null) {return;}
        if (groupMonth){
            cDate[parseInt(year)] = [1,2,3,4,5,6,7,8,9,10,11,12]
        } else {
            if (month.length === 0) {return;}
            cDate[parseInt(year)] = month.map(function(m){return parseInt(m);});
        }
        renderListDate(cDate, $("#groupMonth", modal).prop("checked"), true, $(".listDate", modal));
        $(".error-date", "#form-modal-filter-add").hide();
    });

    var chartOption = {
        chart: {
            spacingBottom: 10,
            type: 'column',
            style: {
                "fontFamily": "Roboto",
            },
            backgroundColor: null
        },
        title: {
            text: '',
            useHTML: true,
            style: {color: "rgba(0,0,0,0.87)", fontSize: "14px", textAlign: 'center'},
        },
        xAxis: {
            categories: [],
            crosshair: false,
            labels: {
                style: {
                    color: "rgba(0,0,0,0.87)",
                }
            },
            tickColor: "rgba(0,0,0,0.2)",
            lineColor: "rgba(0,0,0,0.2)",
        },
        yAxis: {
            min: 0,
            title: null,
            labels: {
                style: {
                    color: "rgba(0,0,0,0.87)",
                },
            },
            gridLineColor: "rgba(0,0,0,0.2)",
        },
        legend: {
            itemStyle: { "color": "rgba(0,0,0,0.87)", "cursor": "pointer", "font-weight":"400", "fontSize": "12px", "textOverflow": "ellipsis" },
            itemHoverStyle: { "color": "rgba(0,0,0,0.87)" },
        },
        tooltip: {
            headerFormat: '<div><div style="font-size:16px;font-weight:400; margin: 10px">{point.key}</div>',
            footerFormat: '</div>',
            pointFormat: '<div style="padding: 0 10px; display: flex; align-items: center; justify-content: space-between;"><span style="color: rgba(0,0,0,0.87); font-weight:400; font-size:14px;">{series.name}</span><span style="font-size:16px; font-weight:500; padding-left: 10px; color:{series.color};">{point.y}</span></div>',
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderColor: 'rgba(255,255,255,0.9)',
            shared: true,
            useHTML: true,
        },
        credits: {enabled: false},
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                allowPointSelect: false,
                events: {
                    legendItemClick: function (e) {
                        e.preventDefault();
                    }
                },
            },
            area: {
                fillOpacity: 0.1,
                allowPointSelect: false,
                point:{
                    events : {
                        legendItemClick: function(e){
                            e.preventDefault();
                        }
                    }
                },
            },
            pie: {
                allowPointSelect: false,
                cursor: 'pointer',
                dataLabels: {
                    distance: -50,
                    format: '{point.percentage:.1f}%',
                    style: {color: "#fff", fontSize: "14px", fontWeight:"400", textOutline:"0px contrast"},
                },
                size: "75%",
                showInLegend: true,
                allowPointSelect: false,
                point:{
                    events : {
                        legendItemClick: function(e){
                            e.preventDefault();
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<div>',
                    footerFormat: '</div>',
                    pointFormat: '<div style="padding: 0 10px; display: flex; align-items: center; justify-content: space-between;"><span style="color: rgba(0,0,0,0.87); font-weight:400; font-size:14px;">{point.name}</span><span style="font-size:16px; font-weight:500; padding-left: 10px; color:{point.color};">{point.y}</span></div>',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(255,255,255,0.9)',
                    shared: true,
                    useHTML: true,
                },
            }
        },
        series: [],
        exporting: {
            buttons: {
                contextButton: {
                    enabled: false
                }
            }
        }
    };
    function set_option_chart(data){
        var content = $("#charts", "#frontend");
        $.each(data, function(dId, v){
            $.each(v, function(fId, tIds){
                var option =  chartOption;
                var d = dataList[fId];
                tIds.forEach(function(tId){
                    var chartBox = $("#chartbox-"+dId+'-'+fId+'-'+tId, content);
                    var type = chartBox.data(chartBox.data("type"));
                    var series = [], title = "";
                    if (chartBox.length === 0) return;
                    if (d.multi===true){
                        var item = $(".select-content .item.active", chartBox);
                        if (item.length === 0) {
                            item = $(".select-content .item:first", chartBox);
                            item.addClass("active");
                        }
                        title = item.html();
                        series = d.listSeries[tId][item.data("sel-id")];
                    } else {
                        title = d.name;
                        series = d.listSeries[tId];
                    }
                    if (type === "pie") {
                        var data = series.map(function(v, i){
                            return {'y': v['data'][0], 'name': v['name'], 'color': v['color']};
                        });
                        series = [{name: d.categories[0],data: data,}];
                        title += "<br />"+d.categories[0];
                    }

                    option.chart.type = type;
                    option.xAxis.categories = d.categories;
                    option.title.text = title;
                    option.series = series;
                    render_charts($(".chart", chartBox), option)
                });
            });
        });
    }

    function render_charts(el, option){
        if (el.highcharts() !== undefined){
            el.highcharts().destroy();
        }
        el.highcharts(option);
    }

    function getSeriesNameTable(series){
        return series.reduce(function(p,n){ return p+'<th class="seriesName">'+n.name+'</th>' }, "");
    }
    function getDataSeriesTable(series, i){
        return series.reduce(function(p,n){var val = n.data[i] === null ? '' : n.data[i];  return p+'<td class="number">'+val+'</td>' }, "");
    }

    function renderTablesBox(dId, fId, tId){
        var tableId = dId+'-'+fId+'-'+tId;
        var data = dataList[fId];
        var series = data.listSeries[tId];
        var width = 0, col = 0, table='';
        if (data.multi){
            col = data.selectors.length * series[data.selectors[0]].length;
            var s = '', s2 = '', s3 = '';
            data.selectors.forEach(function(n, i){
                s += '<th class="title" colspan="'+series[n].length+'">'+data.selectorsName[i]+'</th>';
                s2 += getSeriesNameTable(series[n]);
            });
            data.categories.forEach(function(n, i){
                s3 += '<tr><td class="cName">'+n+'</td>';
                data.selectors.forEach(function(n, q){
                    s3 += getDataSeriesTable(series[n], i)
                });
                s3 += '</tr>';
            });
            table = '<thead><tr><th rowspan="2" class="nohover"></th>'+s+'</tr><tr>'+s2+'</tr></thead><tbody>'+s3+'</tbody>';
        } else {
            col = series.length;
            var s = '';
            data.categories.forEach(function(n, i){
                s += '<tr><td class="cName">'+n+'</td>'+getDataSeriesTable(series, i)+'</tr>';
            });
            table = '<thead><tr><th rowspan="2" class="nohover"></th><th class="title" colspan="'+series.length+'">'+data.name+'</th></tr><tr>'+getSeriesNameTable(series)+'</tr></thead><tbody>'+s+'</tbody>';
        }
        if (col < 4) {
            width = 't';
        } else if (col < 13) {
            width = 'f';
        } else {
            width = 'h';
        }
        var t = '<div id="tablebox-'+tableId+'" data-database="'+dId+'" data-filter="'+fId+'" data-table="'+tId+'"  class="d-flex column table-box box card '+width+'"><div class="card-content d-flex row space-between">';
        t += '<div class="card-title fill-all">'+databases[dId].item[tId]+'</div>';
        t += '<div class="table-controls"><a data-activates="list-menu-t-'+tableId+'" class="dropdown-button btn-floating transparent z-depth-0 waves-effect"><i class="material-icons  grey-text text-darken-3">more_vert</i></a><ul id="list-menu-t-'+tableId+'" class="dropdown-content nested"><li><a data-activates="list-export-t-'+tableId+'"  data-hover="hover" data-alignment="right" class="chartExport dropdown-button"><i class="material-icons">file_download</i>Экспорт</a></li><li><a class="chartInfo"><i class="material-icons">info_outline</i>О фильтре</a></li><li><a class="chartDelete"><i class="material-icons">delete</i>Удалить</a></li></ul><ul id="list-export-t-'+tableId+'" class="dropdown-content list-export"><li><a data-type="xlsx">Экспорт в XLSX</a></li><li><a data-type="ods">Экспорт в ODS</a></li><li><a data-type="csv">Экспорт в CSV</a></li></ul></div></div><div id="table-'+tableId+'" class="table fill-all"><table id="'+tableId+'" class="bordered">'+table+'</table></div></div>';
        return t;
    }
    function renderChartBox(dId, fId, tId){
        var chartId = dId+'-'+fId+'-'+tId;
        var widthChartBox, selectorsText="", sType = "", iType="", tType="";
        if (dataList[fId].categories.length === 1){
            sType = 'pie';
            iType = 'pie_chart';
            tType = 'Круговой';
        } else {
            sType = 'area';
            iType = 'show_chart';
            tType = 'Динейный';
        }
        if (dataList[fId].categories.length < 4) {
            widthChartBox = 't';
        } else if (dataList[fId].categories.length < 13) {
            widthChartBox = 'f';
        } else {
            widthChartBox = 'h';
        }
        if (dataList[fId].multi !== undefined && dataList[fId].multi === true){
            var additionally = dataList[fId].selectors.map(function(q, v){
                return "<span data-sel-id='"+q+"' class='item'>"+dataList[fId].selectorsName[v]+"</span>";
            }).join('');
            selectorsText += '<div class="select-content">'+additionally+'</div>'
        }
        var t = '<div id="chartbox-'+chartId+'" data-first = "column" data-second = "'+sType+'" data-type="first" data-database="'+dId+'" data-filter="'+fId+'" data-table="'+tId+'"  class="d-flex column box chart-box card '+widthChartBox+'"><div class="card-content d-flex row space-between">';
        t += '<div class="card-title fill-all">'+databases[dId].item[tId]+'</div>';
        t += '<div class="chart-controls"><a data-activates="list-menu-'+chartId+'" class="dropdown-button btn-floating transparent z-depth-0 waves-effect"><i class="material-icons  grey-text text-darken-3">more_vert</i></a><ul id="list-menu-'+chartId+'" class="dropdown-content nested"><li><a class="chartType"><i class="material-icons">'+iType+'</i>'+tType+'</a></li><li><a data-activates="list-export-'+chartId+'"  data-hover="hover" data-alignment="right" class="chartExport dropdown-button"><i class="material-icons">file_download</i>Экспорт</a></li><li><a class="chartInfo"><i class="material-icons">info_outline</i>О фильтре</a></li><li><a class="chartDelete"><i class="material-icons">delete</i>Удалить</a></li></ul><ul id="list-export-'+chartId+'" class="dropdown-content list-export"><li><a data-type="application/pdf">Экспорт в PDF</a></li><li><a data-type="image/svg+xml">Экспорт в SVG</a></li><li><a data-type="image/png">Экспорт в PNG</a></li></ul></div>'
        t += '</div><div id="chart-'+chartId+'" class="chart fill-all"></div>'+selectorsText+'</div>';
        return t
    }
    function setFunctionChart(chart, data){
        $(".select-content", chart).mCustomScrollbar({axis: 'x', theme:"minimal-dark",});
        $(".select-content .item", chart).on("click", function(){
            var parent = $(this).closest(".chart-box");
            $(".select-content .item", parent).removeClass("active");
            $(this).addClass("active");
            var did = parent.data("database");
            var fid = parent.data("filter");
            var tid = parent.data("table");
            var q = {};
            q[did] = {};
            q[did][fid] = [tid];
            set_option_chart(q);
        });
        $(".chart-box .chartType", chart).on("click", function(e){
            e.preventDefault();
            var parent = $(this).closest(".chart-box");
            var current = parent.data("type");
            var html = "";
            if (current == "first") {
                parent.data("type", "second");
                html = '<i class="material-icons">insert_chart</i>Солбчатый';
            } else {
                parent.data("type", "first");
                html = parent.data("second")==="pie" ? '<i class="material-icons">pie_chart</i>Круговой' : '<i class="material-icons">show_chart</i>Линейный';
            }
            var a = $(this);
            setTimeout(function(){a.html(html)}, 300);
            var did = parent.data("database");
            var fid = parent.data("filter");
            var tid = parent.data("table");
            var q = {};
            q[did] = {};
            q[did][fid] = [tid];
            set_option_chart(q);
        });
        $(".list-export a", chart).on("click", function(e){
            e.preventDefault();
            $(".chart", $(this).closest(".chart-box")).highcharts().exportChart({type: $(this).data("type")});
        });
        set_option_chart(data);
    }
    function setFunctionTables(tables){
        $('.table table', tables).tableHover({colClass: 'hover', headRows: true, headCols: true});
        $('.table table', tables).tableHeadFixer({'left': 1});
        $(".list-export a", tables).on("click", function(e){
            e.preventDefault();
            var parent = $(this).closest(".table-box");
            var table = $("table", parent);
            var type = $(this).data("type");
            var dId = parent.data("database");
            var wb;
            if (type==='xlsx' || type==='ods' || type === 'csv'){
                wb = XLSX.utils.table_to_book(table[0], {sheet: 'table'});
                if (type==='csv') {
                    wb = XLSX.utils.sheet_to_csv(wb['Sheets']['table'], {FS: ";"})
                } else {
                    var wb = XLSX.write(wb, {bookType: type, bookSST: true, type: 'binary'});
                    wb = s2ab(wb);
                }
            }
            try {
	            saveAs(new Blob([wb],{type:"application/octet-stream"}), 'table.'+type);
            } catch(e) { if(typeof console != 'undefined') console.log(e, wb); }
        });
    }

    function render(data){
        $(".started").hide();
        $(".tabs-wrapper").show();
        var chart = $("#charts", "#frontend");
        var tables = $("#tables", "#frontend");
        chart.html("");
        tables.html("");
        $.each(data, function(dId, v){
            var databaseTitle = databases[dId].title;
            databaseTitle += databases[dId].parent === null ? '' : '<span class="databases-sub-title">('+databases[databases[dId].parent].title+')</span>';
            var dataBoxText = '<div data-database="'+dId+'" class="databases-box"><div class="databases-title light">'+databaseTitle+'</div><div class="chart-list d-flex row space-between wrap"></div></div>';
            chart.append(dataBoxText);
            tables.append(dataBoxText);
            var chartBox = $(".databases-box[data-database='"+dId+"']",chart);
            var tablesBox = $(".databases-box[data-database='"+dId+"']",tables);
            var chartBoxText = "";
            var tableBoxText = "";
            $.each(v, function(fId, tIds){
                tIds.forEach(function(tId){
                    chartBoxText += renderChartBox(dId, fId, tId);
                    tableBoxText += renderTablesBox(dId, fId, tId);
                });
            });
            $(".chart-list", chartBox).html(chartBoxText);
            $(".chart-list", tablesBox).html(tableBoxText);
        });
        setFunctionChart(chart, data);
        setFunctionTables(tables);
        var tabsWrapper = $(".tabs-wrapper");
        $(".dropdown-button", tabsWrapper).dropdown({
            constrainWidth: false,
            alignment: 'right',
        });
        $(".chartInfo", tabsWrapper).on("click", function(e){
            e.preventDefault();
            renderFilterInfo($(this).closest(".box").data("filter"));
        });
        $(".chartDelete", tabsWrapper).on("click", function(e){
            e.preventDefault();
            $(this).closest(".box").fadeOut(300, function(){
                if ($(this).hasClass("chart-box")){
                    $(".chart", $(this)).highcharts().destroy();
                }
                if ($(".box", $(this).closest(".chart-list")).length===1){
                    $(this).closest(".databases-box").remove();
                } else {
                    $(this).remove();
                }
            });
        });
        $(".chartExport .chartDelete", tabsWrapper).on("click", function(e){
            e.preventDefault();
        });
    }

    $("#form-modal-create-report").on("submit", function(e){
        e.preventDefault();
        var tables = $(".tables-list input[type='checkbox']:checked", $(this));
        var coll =  $("#report-collapsible", $(this));
        if (tables.length===0){
            if (!$(".modal-report-tables", coll).hasClass("active")) coll.collapsible('open', 0);
            $(".error-tables", $(this)).fadeIn();
            return;
        }
        var filters = $(".filters-list input[type='checkbox']:checked", $(this));
        if (filters.length===0){
            if (!$(".modal-report-filters", coll).hasClass("active")) coll.collapsible('open', 1);
            $(".error-filters", $(this)).fadeIn();
            return;
        }
        var allData = {};
        $.each(filters, function(){
            var filter_id = parseInt($(this).data("id"));
            $.each(tables, function(){
                var table_id = parseInt($(this).data("id"));
                var databases_id = parseInt($(this).data("table"));
                if (allData[databases_id]===undefined){
                        allData[databases_id] = {}
                }
                if (allData[databases_id][filter_id]===undefined){
                        allData[databases_id][filter_id] = []
                }
                allData[databases_id][filter_id].push(table_id)
            });
            all = false
        });
        $("#modal-create-report").modal("close");
        load_data(allData);
    });
    $(".tables-list input[type='checkbox']", "#form-modal-create-report").on("change", function(){
        $(".error-tables","#form-modal-create-report").hide();
    });
    $("#form-modal-filter-add").on("submit", function(e){
        e.preventDefault();
        var modal = $($(this));
        var collapsible = $("#filter-collapsible", modal);
        var filterId = parseInt($("#filterId", modal).val());
        var title = $("#filterName", modal).val();
        var groupRegion = $("#groupRegion", modal).prop("checked");
        var allRegion = $("#allRegion", modal).prop("checked");
        var groupYear = $("#groupYear", modal).prop("checked");
        var groupMonth = $("#groupMonth", modal).prop("checked");
        var isRange = $("#isRange", modal).prop("checked");
        var selectChart = $("#selectChart", modal).val();
        var listRegion = [], listDate = {}, filter = {};
        if (!allRegion) {
            var checkedRegion = $(".region-selected input[type='checkbox']:checked:enabled", modal);
            if (checkedRegion.length === 0) {
                $(".error-region", modal).fadeIn();
                if (!$(".modal-filter-list-region", modal).hasClass("active")) { $("#filter-collapsible", modal).collapsible('open', 0); }
                return;
            }
            $.each(checkedRegion, function(){ listRegion.push(parseInt($(this).data("id"))); });
        }
        if (isRange) {
            var startYear = parseInt($("#getDateYearStart", modal).val());
            var startMonth = parseInt($("#getDateMonthStart", modal).val());
            var endYear = parseInt($("#getDateYearEnd", modal).val());
            var endMonth = parseInt($("#getDateMonthEnd", modal).val());
            if ( (groupMonth && (startYear===null || endYear===null)) || (!groupMonth && (startYear===null || endYear===null || startMonth===null || endMonth===null))  ){
                if (!$(".modal-filter-list-date", modal).hasClass("active")) { $("#filter-collapsible", modal).collapsible('open', 1); }
                $(".error-date", modal).fadeIn();
                return;
            } else {
                if (startYear < endYear) {
                    startDate = { year: startYear, month: startMonth, };
                    endDate = { year: endYear, month: endMonth, };
                } else {
                    startDate = { year: endYear, month: endMonth, };
                    endDate = { year: startYear, month: startMonth, };
                }
                if (!groupMonth && startDate.month !== undefined && endDate.month !== undefined){
                    if (startDate.year === endDate.year) {
                        var startMonth = startDate.month < endDate.month ? startDate.month : endDate.month;
                        var endMonth = startDate.month > endDate.month ? startDate.month : endDate.month;
                        listDate[startDate.year] = [];
                        for (i=startMonth; i<=endMonth; i++) {listDate[startDate.year].push(i)};
                    } else {
                        listDate[startDate.year] = [];
                        listDate[endDate.year] = [];
                        for (i=startDate.month; i<=12; i++) {listDate[startDate.year].push(i)}
                        for (i=endDate.month; i>0; i--) {listDate[endDate.year].unshift(i)}
                        startDate.year++;
                        endDate.year--;
                    }
                }
                for (i=startDate.year; i<=endDate.year; i++) {listDate[i]=[1,2,3,4,5,6,7,8,9,10,11,12]}
            }
        } else {
            if ($(".listDate .chip-custom.selected", modal).length === 0) {
                if (!$(".modal-filter-list-date", modal).hasClass("active")) { $("#filter-collapsible", modal).collapsible('open', 1); }$(".error-date", modal).fadeIn();
                return;
            } else {
                listDate = getListDate();
            }
        }
        if (!isSelected(groupRegion, groupYear, groupMonth) && selectChart===null){
            if (!$(".modal-filter-list-chart", modal).hasClass("active")) { $("#filter-collapsible", modal).collapsible('open', 2); }$(".error-chart", modal).fadeIn();
            return;
        }
        var is_add = filterList[filterId]===undefined ? true : false;
        filterList[filterId] = {
            title: title,
            region: {
                groupRegion: groupRegion,
                allRegion: allRegion,
                listRegion: listRegion,
            },
            date: {
                groupYear: groupYear,
                groupMonth: groupMonth,
                isRange: isRange,
                listDate: listDate,
            },
            chart: {
                selectChart: selectChart,
            }
        }
        renderFilterList();
        if (is_add) { append_filter_to_create(filterId); }
        $.cookie("filterList", JSON.stringify(filterList));
        $("#modal-filter-add").modal("close");

    });
    $(".region-selected input[type='checkbox']", "#form-modal-filter-add").on("change", function(){
        $(".error-region", "#form-modal-filter-add").hide();
    });
    $("#allRegion", "#form-modal-filter-add").on("change", function(){
        var input =  $(".region-selected .input-checked input", "#form-modal-filter-add")
        $(this).prop("checked") ? $(".region-selected .input-checked input", "#form-modal-filter-add").prop("checked", true).prop("disabled", true) : $(".region-selected .input-checked input", "#form-modal-filter-add").prop("checked", false).prop("disabled", false);
        $(".error-region", "#form-modal-filter-add").hide();
    });
    $(".range-select", "#form-modal-filter-add").on("change", function(){
        $(".error-date", "#form-modal-filter-add").hide();
    });
    $(".chart-select", "#form-modal-filter-add").on("change", function(){
        $(".error-chart", "#form-modal-filter-add").hide();
    });
    $("#groupRegion", "#form-modal-filter-add").on("change", function(){
        renderFilterListChart();
    });
    $("#groupYear", "#form-modal-filter-add").on("change", function(){
        renderFilterListChart();
    });
    $("#groupMonth", "#form-modal-filter-add").on("change", function(){
        var modal = $("#form-modal-filter-add");
        var cDate = getListDate()
        if (!$("#isRange", modal).prop("checked")){
            $.each(cDate, function(year, listMonth){ cDate[year] = [1,2,3,4,5,6,7,8,9,10,11,12]; });
            renderListDate(cDate, $(this).prop("checked"), true, $(".listDate", modal));
        }
        $(this).prop("checked") ? $(".getDateMonth", modal).hide() : $(".getDateMonth", modal).show();
        $(".input-select select", modal).material_select("destroy");
        $(".input-select select", modal).val("-1");
        $(".input-select select", modal).material_select();
        renderFilterListChart();
    });
    $("#isRange", "#form-modal-filter-add").on("change", function(){
        var modal = $("#form-modal-filter-add");
        $(".isRangeFalse .listDate", modal).html("");
        if ($(this).prop("checked")) {
            $(".isRangeFalse", modal).hide();
            $(".isRangeTrue", modal).show();
        } else {
            $(".isRangeFalse", modal).show();
            $(".isRangeTrue", modal).hide();
        }
        $(".error-date", modal).hide();
    });
    $(".add-report").on("click", function(){
        $("#modal-create-report").modal("open");
    });
    $(".input-select select", "#form-modal-filter-add").material_select();
    $("#selectChart", "#form-modal-filter-add").material_select();
    $("#modal-create-report").modal({
        complete: function(modal){
        },
    });
    $("#modal-filter-list").modal({
        complete: function(modal){
            $(".modal-controls", modal).html("");
        }
    });
    $("#modal-filter-add").modal({
        complete: function(modal){
            $("#filter-collapsible", modal).collapsible("close", 0);
            $("#filter-collapsible", modal).collapsible("close", 1);
            $("#filter-collapsible", modal).collapsible("close", 2);
            $("#filterName", modal).val();
            $("input[type='checkbox']", modal).prop("checked", false).trigger("change");
            $(".input-select select", modal).material_select("destroy");
            $(".input-select select", modal).val("-1");
            $(".input-select select", modal).material_select();
        }
    });
    $("#modal-filter-info").modal({
        complete: function(modal){
            $(".modal-header", modal).html("");
            $(".modal-controls", modal).html("");
        }
    });
    $("#loader").modal({
        dismissible: false,
        opacity: .1,
        startingTop: '45%',
        endingTop: '45%',
    });

    $("ul.tabs").tabs({
        onShow: function(t){
            if (t.prop("id")==="charts"){
                setTimeout(function(){
                $.each($(".chart", t), function(){
                    var c = $(this).highcharts().reflow();
                })
                },1);
            }
        },
    });
});