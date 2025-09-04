function approveComment(endpoint,id) {
    console.log(endpoint + id);
    fetch(endpoint + id, {
        method: "put"
    }).then(res => {
        if (res.status === 200) {
            alert("Duyệt thành công!");
            location.reload();
        } else
            alert("Có lỗi xảy ra!");
    });

}
function rejectComment(endpoint,id) {
    console.log(endpoint + id);
    fetch(endpoint + id, {
        method: "put"
    }).then(res => {
        if (res.status === 200) {
            alert("Từ chối thành công!");
            location.reload();
        } else
            alert("Có lỗi xảy ra!");
    });

}