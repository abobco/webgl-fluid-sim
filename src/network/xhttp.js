export function LoadXML(callback, url, async = false, method = "POST") {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this);
        }
    };
    //xhttp.onload = function(){callback(this)};
    xhttp.open(method, url, async);
    xhttp.send();
}