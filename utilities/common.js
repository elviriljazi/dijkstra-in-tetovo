export function loading(show) {
    console.log(show)
    console.log(Date.now())
    document.getElementById('loading').style.display = (show ? 'block' : 'none');
}


