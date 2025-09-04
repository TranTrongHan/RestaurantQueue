
document.addEventListener("DOMContentLoaded", () => {
    renderRevenueChart(revenueStats);
    renderMenuRevenueChart(menuRevenueStats);
    const selectPeriodValue = document.getElementById('selectPeriodValue').value;
    const selectedOrderTypeValue = document.getElementById('selectOrderTypeValue').value;
    if(selectedOrderTypeValue){
        console.log(selectedOrderTypeValue);
    }
    const selectPeriodValueMenu = document.getElementById('selectPeriodValueMenu').value;

    const statsBtn = document.getElementById('statsBtn');
    if(statsBtn){
        statsBtn.addEventListener('click', applyFilter);
        console.log("has btn and added click event");
    }
    const statsMenuBtn = document.getElementById('statsMenuBtn');
    if(statsMenuBtn){
        statsMenuBtn.addEventListener('click', applyMenuFilter);
        console.log("has stats menu btn and added click event");
    }
});

function renderRevenueChart(revenueStats) {
    let labels = revenueStats.map(r => r[0]); // thơời gian
    let data = revenueStats.map(r => r[1]);   // doanh thu
    const ctx = document.getElementById('revenueChart');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: {
                    display: true,
                    text: 'Xu hướng doanh thu theo ' + selectPeriodValue.value
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
function renderMenuRevenueChart(menuRevenueStats) {
    let labels = menuRevenueStats.map(r => r[0]); // tên món ăn
    let data = menuRevenueStats.map(r => r[1]);   // doanh thu
    const ctx = document.getElementById('revenueMenuChart');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: {
                    display: true,
                    text: 'Doanh thu món ăn của ' + selectPeriodValueMenu.value
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
function applyFilter() {
    const selectPeriodValue = document.getElementById('selectPeriodValue').value;
    const selectedOrderTypeValue = document.getElementById('selectOrderTypeValue').value;
    window.location.href = `/restaurantserver/admin/stats?period=${selectPeriodValue}&orderType=${selectedOrderTypeValue}`;
}
function applyMenuFilter(){
    const selectPeriodValueMenu = document.getElementById('selectPeriodValueMenu').value;
    const selectedOrderTypeValue = document.getElementById('selectOrderTypeValue').value;
    window.location.href = `/restaurantserver/admin/stats?periodMenu=${selectPeriodValueMenu}&orderType=${selectedOrderTypeValue}`;
}
