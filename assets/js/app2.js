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

function set_select(el, val){
    let selectClass = 'selected active';
    let text = el.val(val).find('option:selected').text();
    let input = el.prevAll('input.select-dropdown');
    let ul = el.prevAll('ul.select-dropdown');
    let li = ul.find('li:contains(' + text + ')');
    ul.children().removeClass(selectClass);
    li.siblings().removeClass(selectClass).end().addClass(selectClass);
    input.val(text);
}

$(document).ready(function(){
    let table = $.cookie("table");
    let filterList = $.cookie("filterList");
    filterList = filterList !== undefined ? JSON.parse(filterList) : {};
    let dataList={}, fakeRegions={};
    $.each(regions, function(n, i){ fakeRegions[i.id] = n });
    let cDates = {};
    const listColor = ['deep-purple lighten-1', 'blue lighten-1', 'green lighten-1', 'purple lighten-1', 'indigo lighten-1', 'cyan lighten-1',  'teal lighten-1', 'pink lighten-1'];
    const monthList = {
        1: 'Январь', 2: 'Февраль', 3: 'Март',
        4: 'Апрель', 5: 'Май', 6: 'Июнь',
        7: 'Июль', 8: 'Август', 9: 'Сентябрь',
        10: 'Октябрь', 11: 'Ноябрь', 12: 'Декабрь',
    };

    if (table === undefined){
        table = $(".element:first", "#slide-out").data("id");
        $.cookie("table", table)
    }
    $(".element[data-id='"+table+"']", "#slide-out").addClass("active");

    let auto_data_chip = []
    $.each(regions, function(i, v) { auto_data_chip[i]=null });
    function create_autocomplete_chip(list, allRegion){
        let data_chip = []
        if (!allRegion){
            data_chip = list.map(function(r){
                return {tag : fakeRegions[r]};
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
           $(".autocomplete-content").css("max-height", $(".modal-controls").height() - 250);
        });
        $('.chips-autocomplete input', "#filter-chart").on("focusout", function(){
            $(".autocomplete-content").css("max-height", "auto");
        });
    }
    function show_modal_chart(){
        var modal = $("#modal-show-chart");
        //$(".card-title", modal).html(statistics.fields[$(this).data("id")].label);
        $("#table_id", modal).val($(this).data("id"));
        $("#modal-show-chart").modal("open");
        if (Object.keys(filterList).length === 0) {
            show_modal_filter()
        } else {
            add_block_charts();
        }
    }
    function set_modal_filter(id, filter){
        if (id === undefined) { id = "add"; }
        if (filter===undefined){
            filter = {
                "region": {
                    "group":false,
                    "allRegion":true,
                    "listRegion":[]
                },
                "date":{
                    "group":false,
                    "onlyYear":false,
                    "is_range":false,
                    "listDate":{},
                },
                "chart": {}
            }
        }
        let modal = $("#filter-chart"), dataContent = '';
        $("#table-f-id", modal).val(id);
        $("#combine-region", modal).prop("checked", filter.region.group);
        $("#get-region", modal).prop("checked", filter.region.allRegion);
        $("#combine-date", modal).prop("checked", filter.date.group);
        $("#only-years", modal).prop("checked", filter.date.onlyYear);
        $("#range-date", modal).prop("checked", filter.date.is_range);
        let fakeDate = filter.date.is_range ? get_start_end_date(filter.date.listDate, filter.date.onlyYear) : filter.date.listDate;
        let fakeDate = filter.date.is_range ? get_start_end_date(filter.date.listDate, filter.date.onlyYear) : filter.date.listDate;
        render_date_wrapper_content(fakeDate, filter.date.onlyYear);
        show_abscissa(filter.chart);
        if (filter.region.allRegion){
            $('.chips-autocomplete').material_chip("destroy");
            $(".chip-wrapper").hide();
        } else {
            create_autocomplete_chip(filter.region.listRegion, filter.region.allRegion);
            $(".chip-wrapper").show();
        }
    }
    function show_modal_filter(filterId){
        filter = filterId !== undefined ? filterList[filterId] : undefined;
        set_modal_filter(filterId, filter);
        $("#filter-chart").modal("open");
    }
    function render_empty_filter(){
        $("#filter.tabs-content").html('<div class="card-panel empty-filter">Добавьте фильтр для успешного продолжения работы</div>')
    }
    function render_filter(filterId, type){
        let renderFiler = {}, append_text = '';
        let is_update = type==='update' && filterId.length===1 ? true : false;
        if (filterId === undefined) {
            renderFiler = filterList;
        } else {
            renderFiler[filterId] = filterList[filterId]
        }
        if (Object.keys(renderFiler).length===0){
            render_empty_filter();
            return;
        }
        $.each(renderFiler, function(i, v){
            let filterRegion = '', filterDate = '', filterChart = '', filterContent='';
            filterRegion += v.region.group ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по регионам</div>' : '';
            if (v.region.allRegion) {
                filterRegion += '<div class="fake-checked"><i class="material-icons">done</i>Все регионы Забайкальского края</div>';
            } else {
                filterRegion += v.region.listRegion.reduce(function(s, r){
                    return s + '<div class="chip-custom">'+fakeRegions[r]+'</div>';
                }, "");
            }
            filterDate += v.date.group ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по годам</div>' : '';
            filterDate += v.date.onlyYear ? '<div class="fake-checked"><i class="material-icons">done</i>Сгруппировать по месяцам</div>' : '';
            if (!v.date.is_range) {
                filterDate += get_chips_date_add(v.date.listDate, v.date.onlyYear, false);
            } else {
                let fakeDate = get_start_end_date(v.date.listDate, v.date.onlyYear);
                let start = get_chips_date_range("start", fakeDate['start'].year, fakeDate['start'].month);
                let end = get_chips_date_range("end", fakeDate['end'].year, fakeDate['end'].month);
                filterDate += "Диапозон с"+start+" по "+end;
            }
            if (!v.region.group && (!v.date.group || !v.onlyYear)){
                filterChart += "Выборка в графике по ";
                filterChart += v.chart.abscissa==="d" ? "дате" : "региону";
            }
            if (filterRegion.length === 0 && filterDate.length === 0 && filterChart.length === 0){
                return;
            }
            filterContent += filterRegion.length !== 0 ? "<div class=title>Регионы</div><div class='content'>"+filterRegion+"</div>" : "";
            filterContent += filterDate.length !== 0 ? "<div class=title>Дата</div><div class='content'>"+filterDate+"</div>" : "";
            filterContent += filterChart.length !== 0 ? "<div class=title>График</div><div class='content'>"+filterChart+"</div>" : "";
            if (!is_update){
                append_text +="<div data-filter-id='"+i+"' class='card filter-panel'>";
                append_text +="<div class='filter-controls'><a data-filter-id='"+i+"' class='update btn-floating waves-effect'><i class='material-icons'>filter_list</i></a><a data-filter-id='"+i+"' class='delete btn-floating waves-effect'><i class='material-icons'>close</i></a></div>";
                append_text +="<div class='filter-content'>"
            }
            append_text += filterContent;
            if (!is_update){
                append_text +="</div></div>";
            }
        });
        if (is_update){
            $(".filter-panel[data-filter-id='"+filterId[0]+"'] .filter-content","#filter.tabs-content").html(append_text);
        } else {
            $("#filter.tabs-content").append(append_text);
        }
        $(".filter-panel .delete").off("click").on("click", function(){
            let filterId = $(this).data("filter-id")
            delete filterList[filterId];
            delete dataList[filterId];
            $(this).closest(".filter-panel").fadeOut(300,function(){
                $(this).remove()
            });
            $.cookie("filterList", JSON.stringify(filterList));
            if (Object.keys(filterList).length===0){
                render_empty_filter();
            }
        });
        $(".filter-panel .update").off("click").on("click", function(){
            let filterId = $(this).data("filter-id");
            show_modal_filter(filterId);
        });
    }
    render_filter();

    function render_card_fields(data){
        var append_text = "", colors_iter = 0;
        $.each(data, function(i, v){
            var items = "";
            $.each(v.items, function(i, v){
                items += '<div data-id="'+i+'" class="item">'+v+'</div>';
            });
            append_text += '<div class="card preview-chart"><div class="card-title '+listColor[colors_iter]+'">'+v.label+'<a data-id="'+i+'" class="btn-floating halfway-fab waves-effect waves-light deep-orange accent-3"><i class="material-icons">show_chart</i></a></div><div class="list-items">'+items+'</div></div>';
            colors_iter = colors_iter > listColor.length-2 ? 0 : colors_iter+1;
        });
        $("#charts", ".tabs-wrapper").html(append_text);
        $(".preview-chart .card-title a", "#charts").on("click", show_modal_chart);
    }
    function load_tables(){
        $.ajax({
            type: "POST",
            url: "/statistics/get_fields/",
            data: { csrfmiddlewaretoken : $.cookie('csrftoken'), table: table },
            dataType: "json",
            beforeSend: function() {

            },
            success: function(data){
                if (data.status===0){
                    $(".tabs-content", "#frontend").html("<div class='card-panel empty-filter'>В выбранной категории отстутствует статистика</div>")
                    return;
                } else {
                    render_card_fields(data.results);
                }
            },
            complete: function(){
                console.log("complete");
            },
            error: function(){
                show_toast('Произошла ошибка при загрузке данных.<br/>Обновите страницу или попробуйте позже!');
            },
        });
    }
    load_tables();
    $(".element").on("click", function(){
        $(".element").removeClass("active");
        $(this).addClass("active");
        table = $(this).data("id")
        $.cookie("table", table);
        load_tables();
    });

    function get_start_end_date(fakeDate, onlyYear){
        let years = Object.keys(fakeDate).sort(compareNumber)
        let startYear = years[0];
        let endYear = years[years.length-1]
        if (onlyYear) {
            return {'start': {'year': startYear, 'month': 0}, 'end': {'year': endYear, 'month': 0},};
        } else {
            let startMonth = fakeDate[startYear].sort(compareNumber)[0];
            let endMonth = fakeDate[endYear].sort(compareNumber)[fakeDate[endYear].length-1];
            return {'start': {'year': startYear, 'month': startMonth}, 'end': {'year': endYear, 'month': endMonth},};
        }
    }
    function get_chips_date_range(type, year, month=0){
        if (year === -1) return "<div data-type='"+type+"' data-year='-1' class='chip-custom range'>Выберите дату</div>";
        var only_year = "<div data-type='"+type+"' data-year='"+year+"' class='chip-custom selected range'>"+year+" год</div>";
        var with_month = "<div data-type='"+type+"' data-year='"+year+"' data-month='"+month+"' class='chip-custom selected range'>"+monthList[month]+" "+year+" года</div>";
        if (month === 0) {return only_year;} else {return with_month;}
    }
    function get_chips_date_add(fakeDate, only_year=false, is_delete=true ){
        let append_text = '';
        let deleted = is_delete ? "<i class='close material-icons'>close</i>" : "";
        $.each(fakeDate, function(year, listMonth){
            if (only_year) {
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
    function load_data(filterIds=[]){
        let sendFilter = {};
        if (filterIds.length == 0){
            sendFilter = filterList;
        } else {
            for (i=0; i<filterIds.length; i++) {sendFilter[filterIds[i]] = filterList[filterIds[i]];}
        }
        if (sendFilter === undefined || Object.keys(sendFilter).length === 0) {
            return;
        }
        console.log("load data");
        console.log(sendFilter);
        $.ajax({
            type: "POST",
            url: "/statistics/get_stats/",
            data: {
                csrfmiddlewaretoken : $.cookie('csrftoken'),
                filterList: JSON.stringify(sendFilter),
                table: table,
            },
            success: function(data){
                $.each(data, function(i,v){
                    dataList[i] = v;
                });
                console.log(dataList);
            },
            complete: function(){
                console.log('complete');
            },
            error: function(){
                show_toast('Произошла ошибка при загрузке данных.<br/>Обновите страницу или попробуйте позже!');
            }
        })
    }
    load_data();
    //setTimeout(function(){console.log(dataList);}, 1000);
    function add_preloader_charts(ids){
        let preloader = '<div class="preloader"><div class="preloader-wrapper small active"><div class="spinner-layer spinner-white-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div></div>';
        for (i=0; i<ids.length; i++){
            let card_box = $(".card-box[data-filter-id='"+ids[i]+"']", "#modal-show-chart");
            $(".card-box[data-filter-id='"+ids[i]+"']", "#modal-show-chart").append(preloader);
            $(".card-box-controls a", card_box).addClass("disabled");
        }

    }
     var chartOption = {
        chart: {
            spacingBottom: 0,
            type: 'column',
            style: {
                "fontFamily": "Roboto",
            },
            backgroundColor: null
        },
        title: {
            text: '',
            useHTML: true,
            style: {color: "#fff", fontSize: "14px"},
        },
        xAxis: {
            categories: [],
            crosshair: false,
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
            headerFormat: '<div><div style="font-size:14px; color: #fff; font-weight:400; margin: 10px">{point.key}</div>',
            footerFormat: '</div>',
            pointFormat: '<div style="padding: 0 10px; display: flex; align-items: center; justify-content: space-around;"><span style=" color: #fff; font-weight:300; font-size:14px;">{series.name}</span><span style="font-size:16px; padding-left: 10px; color:{series.color};">{point.y}</span></div>',
            backgroundColor: 'rgba(69, 39, 160, 0.7)',
            borderColor: 'rgba(69, 39, 160, 0.9)',
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
                fillOpacity: 0.2,
            }
        },
        series: [],
    };

    function set_option_chart(filterIds){
        console.log(filterIds)
        let modal = $("#modal-show-chart");
        let tableId = $("#table_id", modal).val();
        for (i=0; i<filterIds.length; i++){
            let option = chartOption;
            let chart = $("#chart-"+filterIds[i], modal);
            let chartBox = $(".card-box[data-filter-id='"+filterIds[i]+"']", modal);
            data = dataList[filterIds[i]];
            if (data.multi === true) {
                let item = $(".select-content .item.active", chartBox);
                if (item.length === 0) {
                    item = $(".select-content .item:first", chartBox);
                    item.addClass("active");
                    if (data.categories.length < 13 && data.selectors.length < 13){
                        chart.parent().css("width", "50%");
                    }
                }
                option.series = data.listSeries[tableId][item.data("sel-id")];
                option.title.text = item.html();
            } else {
                option.title.text = data.name;
                option.series = data.listSeries[tableId];
            }
            option.chart.type = $(".type-chart", chartBox).data("type");
            option.xAxis.categories = data.categories;
            render_charts(chart, option);
        }
    }

    function render_charts(chart, option){
        if (chart.highcharts() !== undefined){
            chart.highcharts().destroy();
        }
        chart.highcharts(option);
    }

    function add_block_charts(filterIds){
        let modal = $("#modal-show-chart");
        if (filterIds === undefined){
            filterIds = Object.keys(filterList);
        }
        filterIds = filterIds.map(function(v){ return parseInt(v);});
        let str_card_box = '';
        for (i=0; i<filterIds.length; i++){
            console.log(i, filterIds[i]);
            str_card_box += '<div data-filter-id="'+filterIds[i]+'" class="card-box">';
            str_card_box += '<div class="card-box-controls">';
            str_card_box += '<a data-type="column" class="type-chart btn-floating waves-effect"><i class="material-icons">equalizer</i></a>';
            str_card_box += '<a class="btn-floating waves-effect"><i class="material-icons">filter_list</i></a>';
            str_card_box += '<a class="btn-floating waves-effect"><i class="material-icons">remove</i></a>';
            str_card_box += '</div><div id="chart-'+filterIds[i]+'" class="card-box-content"><div class="card-chart none"></div></div>';
            if (dataList[filterIds[i]].multi===true){
                let additionally = dataList[filterIds[i]].selectors.map(function(q, v){
                    return "<span data-sel-id='"+q+"' class='item'>"+dataList[filterIds[i]].selectorsName[v]+"</span>";
                }).join('');
                str_card_box += '<div class="select-content">'+additionally+'</div>'
            }
            str_card_box += '</div>';
        }
        $(".card-content .mCSB_container", modal).append(str_card_box);
        $(".select-content",  modal).mCustomScrollbar({axis: 'x', theme:"minimal-dark", });
        $(".select-content .item",  modal).on("click", function(){
            $(".item", $(this).parent()).removeClass("active");
            $(this).addClass("active");
            set_option_chart([$(this).closest(".card-box").data("filter-id")]);
        });
        $(".type-chart", modal).on("click", function(){
            if ($(this).data("type")==="column"){
                $(this).data("type", "line");
                $("i", $(this)).html("show_chart");
            } else {
                $(this).data("type", "column");
                $("i", $(this)).html("equalizer");
            }
            set_option_chart([$(this).closest(".card-box").data("filter-id")]);
        });
        set_option_chart(filterIds);
    }
    $(".card-content",  "#modal-show-chart").mCustomScrollbar({axis: 'y', theme:"minimal-dark", });
    function render_date_wrapper_content(fakeDate, only_year, is_range){
        cDates = fakeDate;
        let wrapper = $(".date-wrapper-content", "#filter-chart");
        let append_text = "";
        let type = 'start' in fakeDate || 'end' in fakeDate ? false : true;
        if (type) {
            $(".not-only-years", "#filter-chart").show();
            $(".only-years", "#filter-chart").hide();
            append_text += get_chips_date_add(fakeDate, only_year);
        } else {
            $(".not-only-years", "#filter-chart").hide();
            $(".only-years", "#filter-chart").show();
            let start = get_chips_date_range("start", fakeDate.start.year, fakeDate.start.month);
            let end = get_chips_date_range("end", fakeDate.end.year, fakeDate.end.month);
            append_text = "Диапозон с" + start + "по" + end;
        }
        wrapper.html(append_text);
        $(".chip-custom i",".date-wrapper-content").on("click", function(){$(this).parent().remove();})
        $(".error-date", "#filter-chart").fadeOut();
    }
    function show_abscissa(chart){
        let abscissa = $(".abscissa", "#filter-chart");
        if (!$("#combine-region").prop("checked")&&(!$("#combine-date").prop("checked")|| !$("#only-years").prop("checked"))) {
            abscissa.fadeIn();
            $("#abscissa", abscissa).prop("required", true);
            let val = chart===undefined || chart.abscissa===undefined || chart.abscissa===null  ? -1 : chart.abscissa;
            set_select($("#abscissa", abscissa), val);
        } else {
            abscissa.hide();
            $("#abscissa", abscissa).prop("required", false);
        }
    }
    $(".show-date-picker", "#filter-chart").on("click", function(){
        var select_date = $("#select-date");
        var filter_chart = $("#filter-chart");
        var only_years = $("#only-years", filter_chart).prop("checked");
        var type = $("#range-date", filter_chart).prop("checked") ? "range" : "add";
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
    });
    $("#combine-region").on("change", show_abscissa);
    $("#combine-date").on("change", show_abscissa);
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
        if ($(this).prop("checked")) {
            $(".not-only-years", "#filter-chart").hide();
            $(".only-years", "#filter-chart").show();
            cDates = {
                start: {year: -1, month: 0},
                end: {year: -1, month: 0}
            };
        } else {
            $(".not-only-years", "#filter-chart").show();
            $(".only-years", "#filter-chart").hide();
            cDates = {};
        }
        render_date_wrapper_content(cDates, $("#only-years", "#filter-chart").prop("checked"))
    });
    $("#only-years", "#filter-chart").on("change", function(){
        if (!$("#range-date", "#filter-chart").prop("checked")) {
            $.each(cDates, function(year, months){
                cDates[year] = [1,2,3,4,5,6,7,8,9,10,11,12];
            })
        } else {
            let only_years = $(this).prop("checked")
            cDates.start.month = only_years ? 0 : 1;
            cDates.end.month = only_years ? 0 : 1;
        }
        show_abscissa();
        render_date_wrapper_content(cDates, $(this).prop("checked"));
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
    $("#add-filter", "#filter").on("click", function(){show_modal_filter();});
    $("#all-month", "#select-date").on("change", function(){
        $(this).prop("checked") ? $(".card", "#select-date").addClass("active") : $(".card", "#select-date").removeClass("active");
    });
    $("#form-filter-chart").on("submit", function(e){
        e.preventDefault();
        let filter_chart = $("#filter-chart");
        let count_date = $(".chip-custom.selected", ".date-wrapper-content").length;
        let range = $("#range-date", filter_chart).prop("checked");
        let onlyYear = $("#only-years", filter_chart).prop("checked");
        let allRegion = $("#get-region", filter_chart).prop("checked");
        let groupRegion = $("#combine-region", filter_chart).prop("checked");
        let groupDate = $("#combine-date", filter_chart).prop("checked");
        let listRegion = [];
        let listDate = {};
        if (allRegion) {
            listRegion = [];
        } else {
            chip = $('.chips-autocomplete', "#filter-chart").material_chip('data');
            if (chip.length === 0) {
                $(".error-chip", "#filter-chart").fadeIn();
                return;
            }
            listRegion = chip.map(function(v){
                return regions[v.tag].id;
            });
        }
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

        if (!range){
            $.each($(".chip-custom.selected", filter_chart),function(i, v){
                let year = parseInt($(this).data("year"));
                if ($(this).data("month") === undefined) {
                    listDate[year] = [1,2,3,4,5,6,7,8,9,10,11,12];
                } else {
                    let month = parseInt($(this).data("month"));
                    if (listDate[year] === undefined) listDate[year] = [];
                    listDate[year].push(month);
                }
            });
        } else {
            let start = $(".chip-custom.selected[data-type='start']");
            let end = $(".chip-custom.selected[data-type='end']");
            let startDate, endDate, startYear, endYear;
            if (parseInt(start.data('year')) < parseInt(end.data('year'))) {
                startDate = {
                    year: parseInt(start.data('year')),
                    month: parseInt(start.data('month')),
                };
                endDate = {
                    year: parseInt(end.data('year')),
                    month: parseInt(end.data('month')),
                };
            } else {
                startDate = {
                    year: parseInt(end.data('year')),
                    month: parseInt(end.data('month')),
                };
                endDate = {
                    year: parseInt(start.data('year')),
                    month: parseInt(start.data('month')),
                };
            }
            if (!onlyYear && startDate.month !== undefined && endDate.month !== undefined){
                if (startDate.year === endDate.year) {
                    let startMonth = startDate.month < endDate.month ? startDate.month : endDate.month;
                    let endMonth = startDate.month > endDate.month ? startDate.month : endDate.month;
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
        filter = {
            region: {
                group: groupRegion,
                allRegion: allRegion,
                listRegion: listRegion,
            },
            date: {
                group: groupDate,
                onlyYear: onlyYear,
                is_range: range,
                listDate: listDate,
            },
            chart: {
                abscissa: !groupRegion && (!groupDate || !onlyYear) ? $("#abscissa", filter_chart).val() : null,
            }
        }
        if (filterList===undefined) filterList = {};
        let id = $("#table-f-id", filter_chart).val();
        let type = "update";
        if (id === "add"){
            type = id;
            id = Object.keys(filterList).length+1;
            filterList[id] = filter;
        } else {
            filterList[id] = filter;
        }
        console.log("SUBMIT")
        console.log(filterList);
        console.log("ENDSUBMIT")
        render_filter([id], type);
        $.cookie("filterList", JSON.stringify(filterList));
        filter_chart.modal("close");
        let currentPage = $(".tab a.active", ".tabs").data("page");
        switch (currentPage){
            case "charts":
                add_block_charts([id]);
                break;
            case "filter":
                load_data([id])
                break;
        }

    });
    $("#form-select-date").on("submit", function(e){
        e.preventDefault();
        let filter_chart = $("#filter-chart");
        let only_years = $("#only-years", filter_chart).prop("checked");
        let date_type = $("#range-date", filter_chart).prop("checked");
        let all_month = $("#all-month", $(this)).prop("checked");
        let type = $("#type-add-date",  $(this)).val();
        let year = $("#select-year").val();
        let month;
        if (!only_years && $(".card.active", $(this)).length < 1) {
            $(".error-msg", $(this)).fadeIn();
            return;
        }
        if (!date_type) {
            if (only_years || all_month) {
                month = [1,2,3,4,5,6,7,8,9,10,11,12];
            } else {
                month = [];
                $.each($(".card.active", $(this)), function(i, v){
                    month.push($(this).data("month"));
                });
            }
            cDates[year]= month;
        } else {
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
            cDates[type] = {year: parseInt(year), month: month};
        }
        render_date_wrapper_content(cDates, only_years);
        $("#select-date").modal("close");
    });

    $("#modal-show-chart").modal({
        dismissible: false,
        endingTop: '0%',
        complete: function(modal){
            $("#table_id", modal).val("");
            $.each($(".card-chart", modal), function(i, v){
                var ch = $(".chart", $(this));
                if (ch.length > 0) ch.highcharts().destroy();
            });
            $(".card-content .mCSB_container", modal).html("");
        },
    });
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
    $("#select-year").material_select();
    $("#abscissa").material_select();
});