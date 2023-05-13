let listPays = document.getElementById('side');
let httReq = new XMLHttpRequest();
// creation d'un canvas'
/******************************************/
var cnv = document.createElement('canvas');
cnv.setAttribute('id','myChart');
cnv.setAttribute('width','25cm');
cnv.setAttribute('height','12cm');
/**************************************************/
var contentdiv = document.getElementById('content');
contentdiv.appendChild(cnv);
/**************************************************/

// creation du chart par defaut 'Morocco'
var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        title: {
            display: true,
            text: 'Morocco',
            align: 'center',
            position: 'top',
            fontStyle: 'italic',
            fontSize: 30,
            fontColor: 'blue'
        },
        legend:{
            labels: {
                fontStyle: 'bold'
            }
        }
    }

});

/******************************************************************************/
function updateChart(myChart , resp){
    let date = new Array(); //date Array pour labels

    let ConfirmedCases = new Array();
    let DeathsCases = new Array();
    let RecoveredCases = new Array();
    let ActiveCases = new Array();
    //remplir les tableaux des cas
    for(i=0;i<resp.length;i++){
        let elem = (resp[i].Date).toString();
        date[i] = elem.slice(8,10)+'/'+elem.slice(5,7);
        ConfirmedCases[i] = resp[i].Confirmed
        DeathsCases[i] = resp[i].Deaths
        RecoveredCases[i] = resp[i].Recovered
        ActiveCases[i] = resp[i].Active
    };

    let ChartDatasets= [{
        label: 'Confirmés',
        data: ConfirmedCases,
        borderColor: 'blue',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointStyle: 'star'
        },{
        label: 'Géris',
        data: RecoveredCases,
        borderColor: 'green',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointStyle: 'star'
    },{
        label: 'Décés',
        data: DeathsCases,
        borderColor: 'red',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointStyle: 'star'
    },{ 
        label: 'Active',
        data: ActiveCases,
        borderColor: 'yellow',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointStyle: 'star'
    }];

    myChart.data.labels = date;
    myChart.data.datasets = ChartDatasets;
    myChart.options.title.text = resp[0].Country;
    myChart.update();
}
/*********************************************************************************/

function paysClicked(e){
    if(e==null) code = 'MA'
    else code = e.target.getAttribute('id')
    let httpReq = new XMLHttpRequest();
    httpReq.open('GET' , 'https://api.covid19api.com/dayone/country/'+code, true);
    httpReq.onreadystatechange = function(){
        if(httpReq.readyState == XMLHttpRequest.DONE && httpReq.status == 200){
            let resp = JSON.parse(httpReq.response);
            updateChart(myChart,resp)
        }
    }    
    httpReq.send();
}

/********************************************************************************/

httReq.open("GET" , "https://api.covid19api.com/countries" , true);
httReq.onreadystatechange = function(){
    if(httReq.readyState == XMLHttpRequest.DONE && httReq.status == 200){
        var resp = JSON.parse(httReq.response);
        resp = resp.sort((a,b)=>a.Country<b.Country?-1:1)
        resp.forEach(e => {
            let d = document.createElement('div');
            d.setAttribute('id' , e.ISO2)
            d.innerHTML = e.Country;
            d.addEventListener('click' , paysClicked);
            listPays.appendChild(d);
            
        });
        paysClicked(null);
}}
httReq.send();

/********************************************************************************/