$(function(){
    const cont = $(".alertContainer");
    cont.css("left", "50%");
    cont.css("color", "black");
    cont.width(340);
    var l = cont.position().left;
    var w = cont.width();
    var r = l - (w/2);
    cont.css("left", r.toString() + "px");

    window.addEventListener("resize", () => {
        //All the Error elements
        const cont = $(".alertContainer");
        cont.css("left", "50%");
        cont.css("color", "black");
        cont.width(340);
        var l = cont.position().left;
        var w = cont.width();
        var r = l - (w/2);
        cont.css("left", r.toString() + "px");
    })
})