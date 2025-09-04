function deleteMenuItem(endpoint, id){
    if(confirm("Bạn muốn xóa món ăn này ") === true){
        fetch(endpoint + id, {
            method: "delete"
        }).then(res => {
            if (res.status === 200) {
                alert("Xóa thành công!");
                location.reload();
            } else
                alert("Có lỗi xảy ra!");
        });
    }
}