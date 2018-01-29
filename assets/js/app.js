function show_toast(msg){
    var toastContent = $('<span>'+msg+'</span>').add($('<button class="btn-flat toast-action"><i class="material-icons">close</i></button>'));
    Materialize.toast(toastContent, 8000);
    $("#toast-container .toast").on("click", function(){
        $(this).fadeOut();
    })
}
function round(n){return Math.round(n*100)/100;}
function number_compare(a,b){return a>b?1:a<b?-1:0}

$(document).ready(function(){
    var table = $.cookie("table");
    var fake_regions = {};
    const monthList = {
        1: 'Январь',
        2: 'Февраль',
        3: 'Март',
        4: 'Апрель',
        5: 'Май',
        6: 'Июнь',
        7: 'Июль',
        8: 'Август',
        9: 'Сентябрь',
        10: 'Октябрь',
        11: 'Ноябрь',
        12: 'Декабрь',
    }
    $.each(regions, function(n, i){ fake_regions[i.id] = n });
    var id_charts = 1;
    if (table === undefined){
        table = $(".element:first", "#slide-out").data("id");
        $.cookie("table", table)
    }
    $(".element[data-id='"+table+"']", "#slide-out").addClass("active");
    $(".element").on("click", function(){
        $(".element").removeClass("active");
        $(this).addClass("active");
        table = $(this).data("id")
        $.cookie("table", table);
        load_data();
    });

    var filter = $.cookie("filter");
    if (filter === undefined) {
        var currentTime = new Date();
        var currentYear = currentTime.getFullYear();
        filter = {
            region: {
                group: false,
                all_region: true,
                listRegion: [],
            },
            date: {
                group: false,
                range: false,
                only_year: false,
                type: 'add',
                listDate : {},
            }
        }
        filter.date.listDate[currentYear] = [1,2,3,4,5,6,7,8,9,10,11,12];
        $.cookie("filter", JSON.stringify(filter));
    } else {
        filter = JSON.parse(filter);
    }
    var statistics;
    var chart_series = {};
    var chartOption = {
        chart: {
            spacingBottom: 0,
            type: 'line',
            style: {
                "fontFamily": "Roboto",
            },
            backgroundColor: null
        },
        title: {
            text: '',
            style: {color: "#fff", fontSize: "14px"},
        },
        xAxis: {
            categories: [],
            crosshair: true,
            labels: {
                style: {
                    color: "#d1c4e9",
                }
            },
            tickColor: "#d1c4e9",
            lineColor: "#d1c4e9",
        },
        yAxis: {
            min: 0,
            title: null,
            labels: {
                style: {
                    color: "#d1c4e9",
                },
            },
            gridLineColor: "#d1c4e9",
        },
        legend: {
            itemStyle: { "color": "#d1c4e9", "cursor": "pointer", "fontSize": "12px", "textOverflow": "ellipsis" },
            itemHoverStyle: { "color": "#d1c4e9" },
        },
        tooltip: {
            headerFormat: '<div><div style="font-size:14px; font-weight:900; margin: 10px">{point.key}</div>',
            pointFormat: '<div><div style="font-size:14px; margin: 10px;"></div>{series.name}<div color:{series.color};>{point.y:.1f}</div></div>',
            footerFormat: '</div>',
            pointFormat: '<div><span style="margin: 10px 0; font-weight:400; font-size:14px;">{series.name}</span><span style="font-size:16px; margin: 10px; color:{series.color};">{point.y}</span></div>',
            backgroundColor: 'rgb(255,255,255)',
            borderColor: 'rgb(190,190,190)',
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
        },
        series: [],
    };
    function get_categories_region(){
        if (filter.region.group && filter.region.all_region) return ['Забайкальский край'];
        regionList = filter.region.all_region ? Object.keys(fake_regions) : filter.region.listRegion
        return regionList.map(function(r){ return fake_regions[r] });
    }
    function get_categories_date(){
        let date = filter.date.listDate;
        let listDate = {};
        if (filter.date.type==='range'){
            let start_year, end_year;
            if (!filter.date.only_year){
                if (date.start.year === date.end.year) {
                    let start_month = date.start.month > date.end.month ? date.end.month : date.start.month;
                    let end_month = date.start.month < date.end.month ? date.end.month : date.start.month;
                    listDate[date.start.year] = [];
                    for (i=start_month; i<=end_month; i++) {listDate[date.start.year].push(i)};
                } else {
                    listDate[date.start.year] = [];
                    listDate[date.end.year] = [];
                    if (date.start.year < date.end.year) {
                        for (i=date.start.month; i<=12; i++) {listDate[date.start.year].push(i)};
                        for (i=date.end.month; i>0; i--) {listDate[date.end.year].unshift(i)};
                        start_year = parseInt(date.start.year) + 1;
                        end_year = parseInt(date.end.year) - 1;
                    } else {
                        for (i=date.end.month; i<=12; i++) {listDate[date.end.year].push(i)};
                        for (i=date.start.month; i>0; i--) {listDate[date.start.year].unshift(i)};
                        start_year = parseInt(date.end.year) + 1;
                        end_year = parseInt(date.start.year) - 1;
                    }
                }
            } else {
                start_year = date.start.year > date.end.year ? date.end.year : date.start.year;
                end_year = date.start.year < date.end.year ? date.end.year : date.start.year;
            }
            for (i=start_year; i<=end_year; i++) {listDate[i]=[1,2,3,4,5,6,7,8,9,10,11,12]}
        } else if (filter.date.type === "add") {
            listDate = filter.date.listDate;
        }
        return listDate;

        /*
        let is_one_year = Object.keys(listDate).length < 2 ? true : false;
        let result = count_month ? {} : [];
        $.each(listDate, function(year, months){
            if (count_month){
                $.each(months, function(i, m){
                    result[m] === undefined ? result[m] = 1 : result[m] = result[m] + 1;
                });
            } else if (group_month && months.length===12){
                result = result.concat(year+" год");
            } else {
                result = result.concat(months.map(function(month){
                    let y = is_one_year && !label_year ? '' : ' '+year+' года';
                    return monthList[month]+y;
                }));
            }
        });
        return result;*/
    }
    let chart_colors = ['#9575cd', '#ff8a65', '#81c784', '#4fc3f7', '##e57373', '#ba68c8', '#f06292', '#7986cb', '#009688', '#aed581', '##64b5f6'];
    function render_charts(table_id){
        chartOption.series = chart_series[table_id].series;
        chartOption.title.text = chart_series[table_id].title;
        $("#chart-"+table_id, ".card-content").highcharts(chartOption);
    };
    function set_default_options_chart(){
        //chartOption.chart.type = 'column';
        chartOption.tooltip.shared = true;
    }
    function get_text_date_with_range(listDate, only_year=false){
        if (filter.date.type==="add"){
            if (only_year) {
                return Object.keys(listDate).map(function(year){return year+' год'}).join(', ');
            }
            else {
                return Object.keys(listDate).map(function(year){
                        return listDate[year].map(function(month){
                            return monthList[month]+' '+year+' год'
                        }).join(', '); }).join(', ');
            }
            //cat = get_categories_date(false,true).join(',');
        } else if (filter.date.type==="range"){
            let cat = "";
            let listDate = filter.date.listDate;
            let start = listDate.start.month === 0 || listDate.start.month === undefined ? listDate.start.year+" год" : monthList[listDate.start.month]+' ' +listDate.start.year+' год' ;
            let end = listDate.end.month === 0 || listDate.end.month === undefined ? listDate.end.year+" год" : monthList[listDate.end.month]+' ' +listDate.start.year+' год' ;
            cat = "Период c "+start+" по "+end;
            return cat;
        }
    }
    function set_series(table_id, params){
        set_default_options_chart();
        let values = statistics.data[table_id];
        let fields = statistics.fields[table_id];
        let listDate = get_categories_date();
        console.log(listDate)
        chart_series[params.chart_id] = {title: '', series: []};
        let colors_iter = 0;
        if (filter.region.group && filter.date.group && filter.date.only_year) {
            $.each(values, function(i, v){
                chart_series[params.chart_id].series.push({
                    name: fields.items[i],
                    data: [round(v)],
                    color: chart_colors[colors_iter],
                })
                colors_iter = colors_iter < chart_colors.length ? colors_iter + 1 : 0;
            });

            chart_series[params.chart_id].title = get_categories_region();
            chartOption.xAxis.categories = [get_text_date_with_range(listDate, true)];
            chartOption.tooltip.shared = false;
        } else if (filter.region.group && filter.date.group && !filter.date.only_year){
            let title_region = get_categories_region();
            let title_date = get_text_date_with_range(listDate, true);
            chart_series[params.chart_id].title=title_region+"<br />"+title_date;
            let index_month = []
            $.each(listDate, function(y, m){
                console.log(m);
                for (let i=0; i<m.length; i++){
                    console.log(m[i],index_month.indexOf(m[i]))
                    if (index_month.indexOf(m[i])===-1){
                        index_month.push(m[i]);
                    }
                }
            });
            let date = index_month.map(function(i){return monthList[i]});
            $.each(values, function(i, v){
                let series = {name: fields.items[i], data: [], color: chart_colors[colors_iter]};
                colors_iter = colors_iter < chart_colors.length ? colors_iter + 1 : 0;
                $.each(index_month, function(i, m){
                    if (v[m] === undefined) {
                        series.data.push(null);
                    } else {
                        series.data.push(round(v[m]));
                    }
                });
                chart_series[params.chart_id].series.push(series);
            });
            chartOption.xAxis.categories = date;
        } else if (!filter.region.group && filter.date.group && filter.date.only_year) {
            let index_regions = Object.keys(fake_regions).map(function(m){return parseInt(m)}).sort(number_compare);
            let regions = index_regions.map(function(i){return fake_regions[i]});
            chart_series[params.chart_id].title = get_text_date_with_range(listDate);
            $.each(values, function(i, v){
                let series = {name: fields.items[i], data: [], color: chart_colors[colors_iter]};
                colors_iter = colors_iter < chart_colors.length ? colors_iter + 1 : 0;
                $.each(index_regions, function(i, r){
                    if (v[r] === undefined) {
                        series.data.push(null)
                    } else {
                        series.data.push(round(v[r]));
                    }
                });
                chart_series[params.chart_id].series.push(series);
            });
            chartOption.xAxis.categories = regions;
        }
        console.log(chart_series);
    }
    function add_block_charts(){
        var modal =  $("#modal-show-chart");
        var select_content = "";
        $(".card-content", modal).append('<div id="chart-box-'+id_charts+'" class="card-chart"><div id="chart-'+id_charts+'"></div></div>');
        let type_abscissa = $("#params-abscissa", modal).prop("checked");
        if (!filter.region.group && (!filter.date.group || !filter.date.only_year)){
            if(type_abscissa){
                var listRegion = filter.region.all_region ? Object.keys(fake_regions) : filter.region.listRegion
                select_content = listRegion.reduce(function(s, n){
                    return s + '<span data-type="region" data-id="'+n+'" class="item">'+fake_regions[n]+'</span>'
                }, "")
            } else {
                var listDate = {};
                var date = filter.date.listDate;
                if (filter.date.type==='range'){
                    var start_year, end_year;
                    if (!filter.date.only_year){
                           if (date.start.year === date.end.year) {
                                var start_month = date.start.month > date.end.month ? date.end.month : date.start.month;
                                var end_month = date.start.month < date.end.month ? date.end.month : date.start.month;
                                listDate[date.start.year] = [];
                                for (i=start_month; i<=end_month; i++) {listDate[date.start.year].push(i)};
                           } else {
                                listDate[date.start.year] = [];
                                listDate[date.end.year] = [];
                                if (date.start.year < date.end.year) {
                                    for (i=date.start.month; i<=12; i++) {listDate[date.start.year].push(i)};
                                    for (i=date.end.month; i>0; i--) {listDate[date.end.year].unshift(i)};
                                    start_year = parseInt(date.start.year) + 1;
                                    end_year = parseInt(date.end.year) - 1;
                               } else {
                                    for (i=date.end.month; i<=12; i++) {listDate[date.end.year].push(i)};
                                    for (i=date.start.month; i>0; i--) {listDate[date.start.year].unshift(i)};
                                    start_year = parseInt(date.end.year) + 1;
                                    end_year = parseInt(date.start.year) - 1;
                               }
                           }
                    } else {
                        start_year = date.start.year > date.end.year ? date.end.year : date.start.year;
                        end_year = date.start.year < date.end.year ? date.end.year : date.start.year;
                    }
                    for (i=start_year; i<=end_year; i++) {listDate[i]=[1,2,3,4,5,6,7,8,9,10,11,12]}
                } else if (filter.date.type === "add") {
                    listDate = filter.date.listDate;
                }
                $.each(listDate, function(year, months){
                    select_content += months.reduce(function(con, month){
                        var str_month = month > 9 ? month : "0"+month;
                        return con + '<span data-type="date" data-year="'+year+'" data-month="'+month+'" class="item">'+str_month+'.'+year+'</span>';
                    }, "")
                });
            }
            $('#chart-box-'+id_charts, modal).append('<div class="select-content">'+select_content+'</div>');
            $("#chart-box-"+id_charts+" .select-content", modal).mCustomScrollbar({axis: 'x', theme:"minimal-dark", });
            let first_item = $("#chart-box-"+id_charts+" .select-content .item:first")
            first_item.addClass("active");

        }
        //console.log(statistics)
        let abscissa = {type: type_abscissa};
        set_series($("#table_id", modal).val(), {
            chart_id: id_charts,
            abscissa: abscissa,
        });
        //console.log(abscissa);
        render_charts(id_charts);
        id_charts++;
    }
    var colors_preview_charts = ['deep-purple lighten-1', 'blue lighten-1', 'green lighten-1', 'purple lighten-1', 'indigo lighten-1', 'cyan lighten-1',  'teal lighten-1', 'pink lighten-1']
    function show_chart(){
        var modal = $("#modal-show-chart");
        $(".card-title", modal).html(statistics.fields[$(this).data("id")].label);
        $("#table_id", modal).val($(this).data("id"));
        $("#aggfunc", modal).val($(this).data("aggfunc"));
        add_block_charts();
        $("#modal-show-chart").modal("open");
    }
    function render_view_charts(){
        var append_text = "", colors_iter = 0;
        $.each(statistics.fields, function(i, v){
            var items = "";
            $.each(v.items, function(i, v){
                items += '<div data-id="'+i+'" class="item">'+v+'</div>';
            });
            append_text += '<div class="card preview-chart"><div class="card-title '+colors_preview_charts[colors_iter]+'">'+v.label+'<a data-id="'+i+'" data-aggfunc="'+v.aggfunc+'"class="btn-floating halfway-fab waves-effect waves-light deep-orange accent-3"><i class="material-icons">show_chart</i></a></div><div class="list-items">'+items+'</div></div>';
            colors_iter = colors_iter > colors_preview_charts.length-2 ? 0 : colors_iter+1;
        });
        $("#charts", ".tabs-wrapper").html(append_text);
        $(".preview-chart .card-title a", "#charts").on("click", show_chart);
    }
    $("#modal-show-chart").modal({
        dismissible: false,
        endingTop: '5%',
        complete: function(modal){
            $("#table_id", modal).val("");
            $("#aggfunc", modal).val("");
            $.each($(".card-chart", modal), function(i, v){
                var ch = $(".chart", $(this));
                if (ch.length > 0) ch.highcharts().destroy();
            });
            $(".card-content", modal).html("");
            id_charts = 1;
            chart_series = {};
        },
    });
    $("#export-chart", "#modal-show-chart").dropdown({
        constrainWidth: false,
        gutter: 10,
        belowOrigin: false,
        alignment: 'right',
        stopPropagation: true
    });
    function load_data(){
        //console.log(filter)
        $.ajax({
            type: "POST",
            url: "/statistics/get_stats/",
            data: {
                csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']", $("#form-filter-chart")).val(),
                filter: JSON.stringify(filter),
                table: table,
            },
            success: function(data){
                var wrapper = $(".tabs-content", "#frontend");
                if (data.status === 0) {
                    $(".tabs-content", "#frontend").html("<div class='card-panel empty-filter'>По заданному фильтру данные отстутствуют</div>")
                    return;
                }
                $(".tabs-content", "#frontend").html("");
                $(".action-filter").removeClass("pulse");
                $(".canvas-wrapper", wrapper).fadeIn();
                $(".empty", wrapper).hide();
                statistics = {
                    fields: JSON.parse(data.fields),
                    data: JSON.parse(data.data),
                }
                //console.log(statistics.data)
                render_view_charts();
                /*
                console.log(data)
                console.log(JSON.parse(data.fields));
                console.log(JSON.parse(data.data));
                */
            },
            complete: function(data){
                console.log("complete");
            },
            error: function(data){
                show_toast('При загрузки данных произошла не предвиденная ошибка.<br/>Обновите страницу или попробуйте позже!');
            },
        });
    }
    load_data();
    function get_chips_date_range(type, year, month=0){
        if (year === -1) return "<div data-type='"+type+"' data-year='-1' class='chip-custom range'>Выберите дату</div>";
        var only_year = "<div data-type='"+type+"' data-year='"+year+"' class='chip-custom selected range'>"+year+" год</div>";
        var with_month = "<div data-type='"+type+"' data-year='"+year+"' data-month='"+month+"' class='chip-custom selected range'>"+monthList[month]+" "+year+" года</div>";
        if (month === 0) {return only_year;} else {return with_month;}
    }

    function get_chips_date_add(fakeDate, is_delete = true ){
        var append_text = '';
        var deleted = is_delete ? "<i class='close material-icons'>close</i>" : "";
        $.each(fakeDate.listDate, function(year, listMonth){
            if (fakeDate.only_year) {
                append_text += "<div data-year='"+year+"' class='chip-custom selected'>"+year+" год (сгруппирован)"+deleted+"</div>";
            } else if (listMonth.length === 12) {
                append_text += "<div data-year='"+year+"' class='chip-custom selected'>"+year+" год (по месецам)"+deleted+"</div>";
            } else {
                append_text += listMonth.reduce(function(s, m){
                    return s+"<div data-year='"+year+"' data-month='"+m+"' class='chip-custom selected'>"+monthList[m]+" "+year+" года"+deleted+"</div>";
                }, '')
            }
        });
        return append_text;
    }

    function render_date_wrapper_content(fakeDate){
        var wrapper = $(".date-wrapper-content", "#filter-chart");
        var append_text = "";
        if (fakeDate.type === 'add') {
            $(".not-only-years", "#filter-chart").show();
            $(".only-years", "#filter-chart").hide();
            append_text += get_chips_date_add(fakeDate);
        } else if (fakeDate.type === 'range') {
            $(".not-only-years", "#filter-chart").hide();
            $(".only-years", "#filter-chart").show();
            var start = get_chips_date_range("start", fakeDate.listDate.start.year, fakeDate.listDate.start.month);
            var end = get_chips_date_range("end", fakeDate.listDate.end.year, fakeDate.listDate.end.month);
            append_text = "Диапозон с" + start + "по" + end;
        }
        wrapper.html(append_text);
        $(".chip-custom i",".date-wrapper-content").on("click", function(){$(this).parent().remove();})
        $(".error-date", "#filter-chart").fadeOut();
    }


    function render_filter_view(){
        var filter_region = "", filter_date = "";
        filter_region += filter.region.group ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по регионам</div>' : '';
        if (filter.region.all_region) {
            filter_region += '<div class="fake-checked"><i class="material-icons">done</i>Все регионы Забайкальского края</div>';
        } else {
            filter_region += filter.region.listRegion.reduce(function(s, r){
                return s + '<div class="chip-custom">'+fake_regions[r]+'</div>';
            }, "");
        }
        filter_date += filter.date.group ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по датам</div>' : '';
        filter_date += filter.date.only_year ? '<div class="fake-checked"><i class="material-icons">done</i>Только год</div>' : '';
        if (filter.date.type === 'add') {
            filter_date += get_chips_date_add(filter.date, false);
        } else if (filter.date.type === 'range') {
            var start = get_chips_date_range("start", filter.date.listDate.start.year, filter.date.listDate.start.month);
            var end = get_chips_date_range("end", filter.date.listDate.end.year, filter.date.listDate.end.month);
            filter_date += "Диапозон с" + start + "по" + end;
        }
        var filter_selector = $(".filter");
        if (filter_region.length <= 0){
            $(".filter-region", filter_selector).hide();
        } else {
            $(".filter-region", filter_selector).show();
            $(".filter-region-content", filter_selector).html(filter_region);
        }
        if (filter_region.length <= 0){
            $(".filter-date", filter_selector).hide();
        } else {
            $(".filter-date", filter_selector).show();
            $(".filter-date-content", filter_selector).html(filter_date);
        }
    }
    render_filter_view();
    $("#filter-chart").modal({
        complete: function(modal){
            $('.chips-autocomplete').material_chip("destroy");
        },
    });
    $("#select-date").modal({
        complete: function(modal){
            $(".error-msg", modal).hide();
        }
    });
    var auto_data_chip = []
    $.each(regions, function(i, v) { auto_data_chip[i]=null });
    function create_autocomplete_chip(list){
        let data_chip = []
        if (!filter.all_region){
            data_chip = list.map(function(r){
                return {tag : fake_regions[r]};
            });
        }
        $('.chips-autocomplete').material_chip({
            data: data_chip,
            placeholder: 'Выберите регионы',
            autocompleteOptions: {
                data: auto_data_chip,
                limit: Infinity,
                minLength: 0
            }
        });
        $('.chips-autocomplete', "#filter-chart").on("chip.add", function(e, chip){
            regions[chip.tag] === undefined ? $(".chip:last", ".chips-autocomplete").remove() : $(".error-msg", "#filter-chart").fadeOut();
        })
        $('.chips-autocomplete input', "#filter-chart").on("focusin", function(){
           $(".autocomplete-content").css("max-height", $(".modal-controls").height() - 200);
        });
        $('.chips-autocomplete input', "#filter-chart").on("focusout", function(){
            $(".autocomplete-content").css("max-height", "auto");
        });
    }
    $(".action-filter").on("click", function(){
        let filter_chart = $("#filter-chart");
        let is_range = filter.date.type === 'add' ? false : true;
        $("#combine-region", filter_chart).prop("checked", filter.region.group);
        $("#get-region", filter_chart).prop("checked", filter.region.all_region);
        filter.region.all_region ? $(".chip-wrapper", filter_chart).hide() : $(".chip-wrapper", filter_chart).show();
        $("#combine-date", filter_chart).prop("checked", filter.date.group);
        $("#range-date", filter_chart).prop("checked", is_range);
        $("#only-years", filter_chart).prop("checked", filter.date.only_year);
        create_autocomplete_chip(filter.region.listRegion);
        render_date_wrapper_content(filter.date);
        $("#filter-chart").modal("open");
    });
    $("#form-filter-chart").on("submit", function(e){
        e.preventDefault();
        var filter_chart = $("#filter-chart");
        if ($("#get-region", filter_chart).prop("checked")) {
            filter.region.listRegion = [];
        } else {
            chip = $('.chips-autocomplete', "#filter-chart").material_chip('data');
            if (chip.length === 0) {
                $(".error-chip", "#filter-chart").fadeIn();
                return;
            }
            filter.region.listRegion = chip.map(function(v){
                return regions[v.tag].id;
            });
        }
        var count_date = $(".chip-custom.selected", ".date-wrapper-content").length;
        var range = $("#range-date", filter_chart).prop("checked");
        if (!range) {
            if (count_date < 1) {
                $(".error-date", "#filter-chart").fadeIn();
                return;
            }
        } else if (range) {
            if (count_date < 2) {
                $(".error-date", "#filter-chart").fadeIn();
                return;
            }
        }
        var fakeDate = {
            type: range ? "range" : "add",
            listDate: {},
        }
        if (!range){
            $.each($(".chip-custom.selected", filter_chart),function(i, v){
                let year = parseInt($(this).data("year"));
                if ($(this).data("month") === undefined) {
                    fakeDate.listDate[year] = [1,2,3,4,5,6,7,8,9,10,11,12];
                } else {
                    let month = parseInt($(this).data("month"));
                    if (fakeDate.listDate[year] === undefined) fakeDate.listDate[year] = [];
                    fakeDate.listDate[year].push(month);
                }
            });
        } else {
            fakeDate.listDate = {start: {}, end: {}};
            $.each($(".chip-custom.selected", filter_chart), function(i, v){
                fakeDate.listDate[$(this).data("type")] = {
                    year: parseInt($(this).data("year")),
                }
                if (parseInt($(this).data("month")) > 0) {
                    fakeDate.listDate[$(this).data("type")]['month']=parseInt($(this).data("month"));
                }
            });
        }
        filter.region.group = $("#combine-region", filter_chart).prop("checked");
        filter.region.all_region = $("#get-region", filter_chart).prop("checked");
        filter.date = fakeDate;
        filter.date.group = $("#combine-date", filter_chart).prop("checked");
        filter.date.only_year = $("#only-years", filter_chart).prop("checked");
        $.cookie("filter", JSON.stringify(filter));
        render_filter_view();
        filter_chart.modal("close");
        load_data();
    });
    $('ul.tabs').tabs();
    $("#slide-out").mCustomScrollbar({
        theme:"minimal-dark",
    });
    $(".button-collapse").sideNav();
    $("#get-region", "#filter-chart").on("change", function(){
        $(".error-msg", "#filter-chart").fadeOut();
        if ($(this).prop("checked")) {
            $(".chip-wrapper").hide();
            $('.chips-autocomplete').material_chip("destroy");
        } else {
            $(".chip-wrapper").show();
            create_autocomplete_chip([]);
        }
    });
    $("#range-date", "#filter-chart").on("change", function(){
        $(".date-wrapper-content", "#filter-chart").html("");
        var fakeDate = filter.date;
        if ($(this).prop("checked")) {
            $(".not-only-years", "#filter-chart").hide();
            $(".only-years", "#filter-chart").show();
            fakeDate.type = "range";
            fakeDate.listDate = {
                start: {year: -1, month: 0},
                end: {year: -1, month: 0}
            };
        } else {
            $(".not-only-years", "#filter-chart").show();
            $(".only-years", "#filter-chart").hide();
            fakeDate.type = "add";
            fakeDate.listDate = {};
        }
        render_date_wrapper_content(fakeDate)
    });
    $("#only-years", "#filter-chart").on("change", function(){
        var only_years = $(this).prop("checked");
        var fakeDate = filter.date;
        fakeDate.only_year = only_years;
        if (fakeDate.type === "add") {
            $.each(fakeDate.listDate, function(year, months){
                fakeDate.listDate[year] = [1,2,3,4,5,6,7,8,9,10,11,12];
            })
        } else if (fakeDate.type === "range") {
            fakeDate.listDate.start.month = only_years ? 0 : 1;
            fakeDate.listDate.end.month = only_years ? 0 : 1;
        }
        render_date_wrapper_content(fakeDate);
    })
    $("#all-month", "#select-date").on("change", function(){
        $(this).prop("checked") ? $(".card", "#select-date").addClass("active") : $(".card", "#select-date").removeClass("active");
    });
    $(".card", "#select-date").on("click", function(){
        var type = $("#range-date", "#filter-chart").prop("checked") ? "range" : "add";
        if ($(this).hasClass("disabled")) return;
        $(".error-msg", $("#select-date")).fadeOut();
        if (type === "add") {
            $(this).toggleClass("active");
        } else {
            $(".card", "#select-date").removeClass("active");
            $(this).addClass("active");
        }
        !$(this).hasClass("active") ? $("#all-month", "#select-date").prop("checked", false) : '';
        $(".card", "#select-date").length === $(".card.active", "#select-date").length ? $("#all-month", "#select-date").prop("checked", true) : '';
    });
    $(".show-date-picker", "#filter-chart").on("click", function(){
        var select_date = $("#select-date");
        var filter_chart = $("#filter-chart");
        var only_years = $("#only-years", filter_chart).prop("checked");
        var type = $("#range-date", filter_chart).prop("checked") ? "range" : "add";
        var fakeDate = filter.date;
        if (type==="add"){
            if (only_years){
                $("#all-month", select_date).prop("checked", true).prop("disabled", true);
                $(".card", select_date).addClass("active").addClass("disabled");
            } else {
                $("#all-month", select_date).prop("checked", false).prop("disabled", false);
                $(".card", select_date).removeClass("active").removeClass("disabled");
            }
        } else if (type==="range"){
            $("#all-month", select_date).prop("checked", false).prop("disabled", true);
            if (only_years){
                $(".card", select_date).removeClass("active").addClass("disabled");
            } else {
                $(".card", select_date).removeClass("active").removeClass("disabled");
            }
        }
        $("#type-add-date", select_date).val($(this).data("type"));
        select_date.modal("open");
    })
    $("#select-year").material_select();
    $("#chars_type").material_select();
    $("#form-select-date").on("submit", function(e){
        e.preventDefault();
        var only_years = $("#only-years", "#filter-chart").prop("checked");
        var month;
        var all_month = $("#all-month", $(this)).prop("checked");
        var years = $("#select-year").val();
        var wrapper = $(".date-wrapper-content", "#filter-chart");
        var wrapper = $(".date-wrapper-content", "#filter-chart");
        var type = $("#type-add-date",  $(this)).val();
        var fakeDate = filter.date;
        if (!only_years && $(".card.active", $(this)).length < 1) {
            $(".error-msg", $(this)).fadeIn();
            return;
        }
        if (fakeDate.type === "add") {
            if (only_years || all_month) {
                month = [1,2,3,4,5,6,7,8,9,10,11,12];
            } else {
                month = [];
                $.each($(".card.active", $(this)), function(i, v){
                    month.push($(this).data("month"));
                });
            }
            fakeDate.listDate[years]= month;
        } else if (fakeDate.type === "range"){
            if (only_years) {
                month = 0;
            } else {
                var card_active = $(".card.active", $(this));
                if (card_active.length > 1) {
                    show_toast("Произошла непредвиденная ошибка, при составлении фильтра<br />Обновите страницу и попробуйте еще раз");
                    return;
                }
                month = card_active.data("month")
            }
            fakeDate.listDate[type] = {year: parseInt(years), month: month};
        }
        render_date_wrapper_content(fakeDate);
        $("#select-date").modal("close");
    });

    $(".toggle-filter", ".filter").on("click", function(){
        if ($(this).hasClass("toggle-close")) {
            $(".card-content", ".filter").hide('blind');
            $("i", $(this)).html("expand_more");
        } else {
            $(".card-content", ".filter").show('blind');
            $("i", $(this)).html("expand_less");
        }
        $(this).toggleClass("toggle-close");
    });
});