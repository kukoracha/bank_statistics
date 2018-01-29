$(document).ready(function(){
    $("input.validate").val("");
    $("#login_page form").on("submit", function(e){
        e.preventDefault();
        var form = $(this);
        var btn = $("button", $(this));
        btn.prop("disabled", true);
        $.ajax({
            type: "POST",
            url: "/admin/authenticate/",
            data: form.serialize(),
            success: function(data){
                if (data.status){
                    window.location = data.next;
                } else {
                    $("input", form).addClass("invalid");
                    $(".name", form).css("margin-bottom", 0);
                    $(".error-msg", form).fadeIn();
                }
            },
            complete: function(data){
                btn.prop("disabled", false);
            },
            error: function(data){
            },
        });
    });
});