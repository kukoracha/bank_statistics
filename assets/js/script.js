var tables;

function set_select(el, val){
    var selectClass = 'selected active';
    var text = el.val(val).find('option:selected').text();
    var input = el.prevAll('input.select-dropdown');
    var ul = el.prevAll('ul.select-dropdown');
    var li = ul.find('li:contains(' + text + ')');
    ul.children().removeClass(selectClass);
    li.siblings().removeClass(selectClass).end().addClass(selectClass);
    input.val(text);
}

function show_toast(msg){
    var toastContent = $('<span>'+msg+'</span>').add($('<button class="btn-flat toast-action"><i class="material-icons">close</i></button>'));
    Materialize.toast(toastContent, 8000);
    $("#toast-container .toast").on("click", function(){
        $(this).fadeOut();
    })
}

var tempScrollTop, currentScrollTop = 0;
$(".content").scroll(function(){
    currentScrollTop = $(this).scrollTop();
    if (tempScrollTop < currentScrollTop){
        $(".action-add").fadeOut(200);
    } else if (tempScrollTop > currentScrollTop) {
        $(".action-add").fadeIn(200);
    }
    tempScrollTop = currentScrollTop;
});

function render_element(element){
    if (element.created) {
        $(".content").append('<div id="card_'+element.card_id+'" class="card"><a class="btn-edit btn-floating btn deep-orange waves-effect waves-light"><i class="material-icons">edit</i></a><div class="main element"></div>');
    }
    var main = $(".card#card_"+element.card_id+" .main");
    $.each(element.data, function(i, v){
        if (i === "name"){
            main.html(v);
        } else {
            main.attr("data-"+i, v);
        }
    });
    var sub = "";
    $.each(element.sub, function(i, v){
        var data_sub = "";
        var name = "";
        $.each(v, function(i, v){
            if (i === "name"){
                name = v;
            } else {
                data_sub += "data-"+i+"='"+v+"' ";
            }
        });
        sub += '<div class="sub element" '+data_sub+'>'+name+'</div>'
    });
    var card = $(".card#card_"+element.card_id);
    $(".sub", card).remove();
    card.append(sub);
    $(".sub", card).html();
};

function ready_tables(){
    var id_sub_table = 1;
    function add_sub_tables(id, value='', active){
        var checked = active==true ? "checked" : "";
        var tr = '<tr><td class="table-checked"><input id="sub_table_'+id_sub_table+'" type="checkbox" '+checked+'/><label for="sub_table_'+id_sub_table+'"></label></td><td class="table-input"><input data-id="'+id+'" value="'+value+'" type="text" class="validate valid"></td><td class="table-action"><i class="material-icons left">delete</i></td></tr>';
        var modal_controls_sub_table = $(".modal-controls-sub table", "#form-edit-table");
        modal_controls_sub_table.append(tr).parent().scrollTop(modal_controls_sub_table.height());
        $(".modal-controls-sub table", "#form-edit-table").height();
        $(".modal-controls-sub table td.table-action i", "#form-edit-table")
        .off("click")
        .on("click", function(){
            $(this).toggleClass("return");
            if ($(this).hasClass("return")) {
                if ($("td.table-input input", $(this).closest("tr")).data("id") === "new"){
                    $(this).closest("tr").remove();
                } else {
                    $(this).html("undo");
                    $("td input", $(this).closest("tr")).prop('disabled', true);
                }
            } else {
                $("td input", $(this).closest("tr")).prop('disabled', false);
                $(this).html("delete")
            }
        });
        $(".modal-controls-sub table td.table-checked #sub_table_"+id_sub_table, "#form-edit-table")
        .on("change", function(){
            $(this).prop("checked") === true ? $("#active-table", "#edit-table").prop("checked", true) : '';
        });
        id_sub_table++;
    }

    function show_modal_case(el){
        var modal = $("#case-table");
        $("a.chart", modal).attr("href", "/admin/chart/"+$(this).data("id"));
        $("a.fill", modal).attr("href",  "/admin/fill/"+$(this).data("id"));
        $("#case-table").modal("open");
    }

    function show_modal_table(type, el){
        var form = $("#form-edit-table");
        if (type==="edit") {
            var main = $(".main", el);
            $(".modal-header", form).html("Редактирование");
            $("#name-table", form).val(main.html()).data("id", main.data("id")).addClass("valid");
            $("#active-table", form).prop("checked", main.data("is_active"));
            $("#name-table+label", form).addClass("active");
            $(".sub", el).each(function(){
                add_sub_tables($(this).data("id"), $(this).html(), $(this).data("is_active"));
            });
        } else {
            $(".modal-header", form).html("Создание");
            $("#name-table", form).data("id", "new");
        }
        $("#edit-table").modal("open");
    }

    $(".action-add").on("click", function(){show_modal_table("add")});
    $("#tables .element").on("click", show_modal_case);
    $("#active-table", "#edit-table").on("change", function(){
        $(this).prop("checked") === false ? $(".modal-controls-sub table td.table-checked input", "#edit-table").prop("checked", false) : '';
    });
    $("#tables .btn-edit-table").on("click", function(){
        show_modal_table("edit", $(this).parent())
    });

    $("#add-sub-tables", "#edit-table").on("click", function(){
        add_sub_tables("new");
    });

    $("#form-edit-table").on("submit", function(e){
        e.preventDefault();
        var form = $(this);
        var table_name = $("#name-table", $(this)).val().trim();
        var table_id = $("#name-table", $(this)).data("id");
        var table_active = $("#active-table", $(this)).prop("checked");
        var sub = [];
        var remove_sub = [];
        $.each($(".modal-controls-sub tr", $(this)), function(){
            var input = $(".table-input input", $(this));
            var checkbox = $(".table-checked input", $(this));
            if (input.prop("disabled")) {
                remove_sub.push(input.data("id"));
            } else if (input.val().trim().length > 0)  {
                sub.push({
                    "id": input.data("id"),
                    "name": input.val().trim(),
                    "active": checkbox.prop("checked"),
                });
            }
        });
        $.ajax({
            type: "POST",
            url: "/statistics/update_table/",
            data: {
                csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']", form).val(),
                table_id: table_id,
                table_name: table_name,
                table_active: table_active,
                remove_sub: JSON.stringify(remove_sub),
                sub: JSON.stringify(sub),
            },
            success: function(data){
                render_element(data);
                var table = $("#card_"+data.card_id);
                $(".btn-edit", table).off("click").on("click", function(){
                    show_modal_table("edit", $(this).parent())
                });
                $(".element", table).on("click", show_modal_case);
            },
            complete: function(data){
                $("#edit-table").modal("close");
            },
            error: function(data){
                show_toast('При сохранении произошла не предвиденная ошибка.<br/>Обновите страницу или попробуйте позже!');
            },
        });
        //$("button", $(this)).prop("disabled", true);
    });

    $("#edit-table").modal({
        dismissible: false,
        complete: function(modal){
            $(".modal-header", modal).html("");
            $(".modal-controls-sub table", modal).html("");
            $("#name-table", modal).val("").removeClass("valid").removeClass("invalid").data("id", "");
            $("#name-table+label", modal).removeClass("active");
            $("button",modal).prop("disabled", false);
            id_sub_table = 0;
        }
    });
    $("#case-table").modal({
        endingTop: "25%",
        complete: function(modal){
            $("a", modal).attr("href", "");
        }
    });
    //$("#case-table").modal("open");
}

function ready_charts(){
    function add_item_charts(id, value=""){
        var tr = '<tr><td class="table-input"><input data-id="'+id+'" value="'+value+'" type="text" class="validate valid"></td><td class="table-action"><i class="material-icons left">delete</i></td></tr>';
        var modal_controls_sub_table = $(".modal-controls-sub table", "#form-edit-chart");
        modal_controls_sub_table.append(tr);
        modal_controls_sub_table.parent().scrollTop(modal_controls_sub_table.height());
        $(".modal-controls-sub table", "#form-edit-table").height();
        $(".modal-controls-sub table td.table-action i", "#form-edit-chart")
        .off("click")
        .on("click", function(){
            $(this).toggleClass("return");
            if ($(this).hasClass("return")) {
                if ($("td.table-input input", $(this).closest("tr")).data("id") === "new"){
                    $(this).closest("tr").remove();
                } else {
                    $(this).html("undo");
                    $("td input", $(this).closest("tr")).prop('disabled', true);
                }
            } else {
                $("td input", $(this).closest("tr")).prop('disabled', false);
                $(this).html("delete")
            }
        });
    }

    function show_modal_chart(type, el){
        var form = $("#form-edit-chart");
        if (type==="edit") {
            var main = $(".main", el);
            $(".modal-header", form).html("Редактирование");
            $("#name-chart", form).val(main.html()).data("id", main.data("id")).addClass("valid");
            $("#active-chart", form).prop("checked", main.data("is_active"));
            $("#name-chart+label", form).addClass("active");
            console.log(el)
            console.log(el.data());
            set_select($("#agg-chart", form), el.data("aggfunc"));
            $(".sub", el).each(function(){
                add_item_charts($(this).data("id"), $(this).html(), $(this).data("is_active"));
            });
        } else {
            $(".modal-header", form).html("Создание");
            $("#name-chart", form).data("id", "new");
        }
        $("#edit-chart").modal("open");
    }

    $("#add-item-chart", "#edit-chart").on("click", function(){
        add_item_charts("new");
    });

    $("#form-edit-chart").on("submit", function(e){
        e.preventDefault();
        var form = $(this);
        var chart_name = $("#name-chart", $(this)).val().trim();
        var chart_id = $("#name-chart", $(this)).data("id");
        var chart_active = $("#active-chart", $(this)).prop("checked");
        var chart_aggregate = $("#agg-chart", $(this)).val();
        var sub = [];
        var remove_sub = [];
        $.each($(".modal-controls-sub tr", $(this)), function(){
            var input = $(".table-input input", $(this));
            if (input.prop("disabled")) {
                remove_sub.push(input.data("id"));
            } else if (input.val().trim().length > 0)  {
                sub.push({
                    "id": input.data("id"),
                    "name": input.val().trim(),
                });
            }
        });
        $.ajax({
            type: "POST",
            url: "/statistics/update_field/",
            data: {
                csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']", form).val(),
                type: $("input#type-form-edit-chart", form).val(),
                chart_id: chart_id,
                table_id: table_id,
                chart_name: chart_name,
                chart_active: chart_active,
                chart_aggregate: chart_aggregate,
                remove_sub: JSON.stringify(remove_sub),
                sub: JSON.stringify(sub),
            },
            success: function(data){
                render_element(data);
                var field = $("#card_"+data.card_id);
                $(".btn-edit", field).off("click").on("click", function(){
                    show_modal_chart("edit", $(this).parent())
                });
            },
            complete: function(data){
                $("#edit-chart").modal("close");
            },
            error: function(data){
                show_toast('При сохранении произошла не предвиденная ошибка.<br/>Обновите страницу или попробуйте позже!');
            },
        });
    });

    $(".action-add").on("click", function(){show_modal_chart("new")});
    $("#field .btn-edit-field").on("click", function(){
        show_modal_chart("edit", $(this).parent())
    });
    $('#agg-chart', "#edit-chart").material_select();
    $("#edit-chart").modal({
        dismissible: false,
        complete: function(modal){
            $(".modal-header", modal).html("");
            $("#type-form-edit-chart", modal).val("");
            $(".modal-controls-sub table", modal).html("");
            $("#name-chart", modal).val("").removeClass("valid").removeClass("invalid").data("id", "");
            $("#name-chart+label", modal).removeClass("active");
            $("button",modal).prop("disabled", false);
            set_select($("#agg-chart", modal), "");
        }
    });
}

function ready_fill(){
    function delete_card(el){
        $("#card-id", "#delete-card").val(el.parent().data("id"));
        $("#delete-card").modal("open");
    }

    $(".card .delete").on("click", function(){ delete_card($(this)); });
    var currentTime = new Date();
    var currentMonth = currentTime.getMonth()+1;
    var currentYear = currentTime.getFullYear();
    var dataYear = {};
    for (i = currentYear-5; i <= currentYear+5; i++) {dataYear[i] = null}

    function set_disabled_month(year){
        var card = $(".card", "#year_"+year);
        $("#edit-fill .card").removeClass("disabled");
        $.each(card, function(){
            $("#edit-fill .card[data-month='"+$(this).data("month")+"']").addClass("disabled").removeClass("active");
        });
    }
    $('#year-fill').autocomplete({
        data: dataYear,
        limit: 10,
        minLength: 0,
    });
    $('#year-fill').on("change", function(){ set_disabled_month($(this).val()); });
    $("#edit-fill .card").on("click", function(){
        if ($(this).hasClass("disabled")){
            return;
        }
        $(".error-msg", "#form-edit-fill").fadeOut();
        $("#edit-fill .card").removeClass("active");
        $(this).addClass("active");
    });
    $(".action-add").on("click", function(){
        $("#year-fill", "#edit-fill").val(currentYear).addClass("valid");
        $("#year-fill+label", "#edit-fill").addClass("active");
        set_disabled_month(currentYear);
        $("#edit-fill").modal("open");
    });
    $("#form-edit-fill").on("submit", function(e){
        e.preventDefault();
        var form = $(this);
        var year = parseInt($("#year-fill", form).val());
        if (isNaN(year)) {
            $("#year-fill").addClass("invalid");
            return;
        }
        var month = $(".card.active", form).data("month");
        if (month === undefined){
            $(".error-msg", form).fadeIn();
            return;
        }
        $.ajax({
            type: "POST",
            url: "/statistics/update_fill/",
            data: {
                csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']", form).val(),
                year: year,
                month: month,
                table_id: table_id,
            },
            success: function(data){
                if (!data.created) {
                    show_toast('Отчет за заданный период времени уже создан!')
                    return;
                }
                var year = $("#year_"+data.year, ".content");
                if (year.length === 0) {
                    $(".year-list", ".content").append('<div id="year_'+data.year+'" style="order: '+data.year+';" class="year-month"><div class="year">'+data.year+'</div><div class="month-list d-flex wrap"></div></div>');
                     year = $("#year_"+data.year, ".content");
                }
                $(".month-list", year).append('<div id="card_'+data.id+'" data-id="'+data.id+'" data-month="'+data.month+'" data-year="'+data.year+'" class="card"><a href="date/'+data.year+'/'+data.month+'/" class="month"></a><a class="btn btn-flat btn-floating white waves-effect waves delete"><i class="material-icons deep-purple-text">delete</i></a></div>');
                $("#card_"+data.id+" .delete").on("click", function(){ delete_card($(this)); });
            },
            complete: function(data){
                $("#edit-fill").modal("close");
            },
            error: function(data){
                show_toast('При сохранении произошла не предвиденная ошибка.<br/>Обновите страницу или попробуйте позже!');
            },
        });
    });
    $("#edit-fill").modal({
        complete: function(modal){
            $(".card", modal).removeClass("active");
            $("#year-fill", modal).val("").removeClass("valid").removeClass("invalid");
            $("#year-fill+label", modal).removeClass("active");
        },
    });
}

function ready_chart_fill(){
    $('.tooltipped').tooltip({delay: 50});
    data_regions = {}
    $.each(regions, function(i, v) {data_regions[i]=null});
    $('#select-region').autocomplete({
        data: data_regions,
        limit: data_regions.length,
        minLength: 0,
    });
    function render_view(){
        $(".chart-input-field input").val(0);
        var input = $('#select-region').val();
        if (input.length === 0) {
            $(".empty-region").removeClass("none");
            $(".charts").addClass("none");
        } else {
            $(".empty-region").addClass("none");
            $(".charts").removeClass("none");
            $.each(fieldsValue[regions[input]], function(i, v){
                $(".chart-input-field #chart_"+i).val(v.value);
            });
        }
    }
    $('#select-region').on("change", function(){
        if (regions[$(this).val()] === undefined){
            $(this).val("");
            return;
        }
        render_view();
    });
    $('#select-region').on("focusin", function(){
        $(this).val("");
        $(".autocomplete-content").css("max-height", $(".main-content:not(.none)").height());
    });
    $('#select-region').on("focusout", function(){
        $(".autocomplete-content").css("max-height", "auto");
    });
    $(".chart-input-field input").on("change", function(){
        var select_region = $('#select-region');
        var value = parseInt($(this).val());
        if (select_region.val().length === 0 || isNaN(value)){
            return;
        }
        if (fieldsValue[regions[select_region.val()]][$(this).data("id")] === undefined) {
            fieldsValue[regions[select_region.val()]][$(this).data("id")] = {'value':0, 'changed': true}
        }
        fieldsValue[regions[select_region.val()]][$(this).data("id")]['value'] = value;
        fieldsValue[regions[select_region.val()]][$(this).data("id")]['changed'] = true;
    });
    $(".action-add").on("click", function(){
        $("#sure-save").modal("open");
    });
    $("#form-save-card").on("submit", function(e){
        var form = $(this);
        e.preventDefault();
        $("#loader").modal("open");
        $.ajax({
            type: "POST",
            url: "/statistics/update_chart_fill/",
            data: {
                csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']", form).val(),
                fill_id: fill_id,
                fieldsValue: JSON.stringify(fieldsValue),
            },
            success: function(data){
                if (data==='ok'){
                    show_toast('Сохранение прошло успешно!');
                }
            },
            complete: function(data){
                $("#sure-save").modal("close");
                $("#loader").modal("close");
            },
            error: function(data){
                show_toast('При сохранении произошла не предвиденная ошибка.<br/>Обновите страницу или попробуйте позже!');
            },
        });
    });
    $("#sure-save").modal();
    function XtoArray(sheet) {
        var array = [];
        var range = XLSX.utils.decode_range(sheet['!ref']);
        for (var R = range.s.r; R <= range.e.r; ++R) {
            var row = new Object;
            array.push(row);
            for (var C = range.s.c; C <= range.e.c; ++C) {
                var cellref = XLSX.utils.encode_cell({c: C, r: R});
                var chr = String.fromCharCode(97 + C);
                if (!sheet[cellref]){
                    row[chr] = 0;
                    continue;
                }
                var cell = sheet[cellref];
                row[chr] = cell.v;
            }
        }
        return array;
    }
    function create_sheet(){
        var ws = {}, cR = {}, rC = {};
        var cell_ref;
        var C = 3;
        var R = 2;
        var merges = [];
        $.each(regions, function(v, i){
            cell_ref = XLSX.utils.encode_cell({r: 0, c: C});
            ws[cell_ref] = {v: i, t: 'n'};
            cell_ref = XLSX.utils.encode_cell({r: 1, c: C});
            ws[cell_ref] = {v: v, t: 's'};
            cR[i] = C;
            C++;
        });
        $.each($(".card", ".charts"), function(i, v){
            var smR = R;
            var emR;
            cell_ref = XLSX.utils.encode_cell({r: R, c: 1});
            ws[cell_ref] = {v: $(".name", $(this)).html(), t: 's'};
            $.each($(".chart-input-field", $(this)), function(i, v){
                cell_ref = XLSX.utils.encode_cell({r: R, c: 0});
                ws[cell_ref] = {v: $("input", $(this)).data('id'), t: 'n'};
                cell_ref = XLSX.utils.encode_cell({r: R, c: 2});
                ws[cell_ref] = {v: $("label", $(this)).html(), t: 's'};
                rC[$("input", $(this)).data('id')] = R;
                R++
            });
            emR = R-1;
            merges.push({s: {c: 1, r: smR}, e: {c: 1, r: emR}});
        });
        $.each(fieldsValue, function(i, charts){
            var reg_id = i;
            $.each(charts, function(i, v){
                cell_ref = XLSX.utils.encode_cell({c: cR[reg_id], r: rC[i]});
                ws[cell_ref] = {v: v.value, t: 'n'};
            })
        });
        ws['!merges'] = merges;
        ws['!ref'] =  XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c:--C, r: --R}});
        return ws;
    }
    function read_file(file){
        var fileTypes = ['xls', 'xlsx'];
        var ext = file.name.split('.').pop().toLowerCase();
        isSuccess = fileTypes.indexOf(ext) > -1;
        if (!isSuccess){
            show_toast("Неверный формат файла! <br/>(Допустимые форматы: xls, xlsx)");
            return;
        }
        fr = new FileReader();
        fr.onerror = function (e) {
            if(e.target.error.name === "NotReadableError"){
                show_toast("Произошла ошибка при чтении файла!");
            }
        }
        fr.onload = function(e){
            var data = e.target.result;
            var workbook = XLSX.read(data, {type: 'binary'});
            if (workbook.SheetNames[0] !== 'statistics') {
                show_toast("Отсутствует страница 'statistics'");
                return;
            }
            var sheet = workbook.Sheets['statistics'];
            if (!sheet['!ref']) show_toast("Произошла ошибка при чтении файла!");
            console.log(sheet['!ref']);
            var array = XtoArray(sheet);
            var region_ids = array[0];
            var values = array.slice(2);
            var fvalues = {};
            try {
                $.each(values, function(i, value){
                    var chart_id = value.a;
                    delete value.a;
                    delete value.b;
                    delete value.c;
                    $.each(value, function(i, v){
                        var old_value = fieldsValue[region_ids[i]][chart_id].value;
                        var new_value = parseInt(v);
                        if (isNaN(new_value)) new_value = 0;
                        new_value = new_value > 0 ? new_value : 0;
                        var changed = old_value === new_value ? false : true;
                        if (fvalues[region_ids[i]] === undefined) fvalues[region_ids[i]] = {};
                        fvalues[region_ids[i]][chart_id] = {value: new_value, changed: changed};
                    });
                });
            } catch (err) {
                console.log(err);
                show_toast("Произошла ошибка при чтении файла!");
                return;
            }
            fieldsValue = fvalues;
            render_view();
            show_toast("Данные успешно загружены.<br/>Нажмите кнопку сохранить, для сохранения результата!");
        }
        fr.readAsBinaryString(file);
    }
    function Workbook() {
	    if(!(this instanceof Workbook)) return new Workbook();
	    this.SheetNames = [];
	    this.Sheets = {};
    }
    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
    $("#export").on("click", function(){
        var wb = new Workbook();
        var ws = create_sheet();
        wb.SheetNames.push('statistics');
        wb.Sheets['statistics'] = ws;
        var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "statistics.xlsx")
    });
    $("#import").on("click", function(){
        $("input", $(this))[0].click();
    });
    $("#import input").on("change", function(){
        read_file($(this)[0].files[0]);
        $(this).val('');
    })
}

$(document).ready(function(){
    $('.dropdown-button').dropdown({
        constrainWidth: false, // Does not change width of dropdown to that of the activator
        hover: false, // Activate on hover
        gutter: 0, // Spacing from edge
        belowOrigin: false, // Displays dropdown below the button
        stopPropagation: true // Stops event propagation
      }
    );
    switch (current_page) {
        case "tables": ready_tables(); break;
        case "fields": ready_charts(); break;
        case "fill": ready_fill(); break;
        case "chart_fill": ready_chart_fill(); break;
    }
    $("#loader").modal({
        dismissible: false,
        opacity: .1,
        startingTop: '45%',
        endingTop: '45%',
    });
    $("#delete-card").modal({
        complete: function(modal){
            $("#card-id", modal).val("");
        }
    });
    $(".modal .delete").on("click", function(){
        $("#card-id", "#delete-card").val($(".name-card", ".modal.edit").data("id"));
        $("#delete-card").modal("open");
    });
    $("#form-delete-card").on("submit", function(e){
        e.preventDefault();
        $.ajax({
            type: "POST",
            url: "/statistics/delete/",
            data: {
                csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']", "#delete-card").val(),
                id: $("#card-id", "#delete-card").val(),
                page: current_page,
            },
            success: function(data){
                $("#card_"+data, ".content").fadeOut(function(){
                    if (current_page === 'fill'){
                        if ($(".card", $(this).parent()).length == 1){
                            $(this).closest(".year-month").remove();
                        }
                    }
                    $(this).remove();
                });
            },
            complete: function(data){
                $("#delete-card").modal("close");
                $(".modal.edit").modal("close");
            },
            error: function(data){
                show_toast('При удалении произошла не предвиденная ошибка.<br/> Обновите страницу или попробуйте позже!');
            },
        })
    });
});