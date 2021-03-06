
var params = {};
URI(window.location.href).query().split("&").forEach(function(pair){
  var keyVal = pair.split("=");
  params[keyVal[0]] = decodeURIComponent(keyVal[1]);
  if(keyVal[0] == "data" || keyVal[0] == "rec"){
    params[keyVal[0]] = JSON.parse(params[keyVal[0]]);
  }
});

console.log(params);

$("#username").text('@' + params['user'] + '...' );

function loadData() {

    jQuery.ajax({
            url: "http://localhost:3000/identify",
            type: "GET",
            data: {
                "url": params.url,
                "rec": params.rec,
                "images": JSON.stringify(params.data.images)
            },
        })
        .done(function (data, textStatus, jqXHR) {

            var allData = data.concat(params.data.data);
            var thisAvg = params.data.avg * 100;
            var thisStdDev = params.data.stddev * 100;
            var thisciCeil = params.data.cvCeil;
            var thisciFloor = params.data.cvFloor;

            console.log("ALL DATA: " + allData);
            $('#container').highcharts({
                chart: {
                    zoomType: 'x',
                    backgroundColor: "#FFFFFF"
                },
                title: {
                    text: ''
                },
                subtitle: {},
                xAxis: {
                    type: 'datetime'
                },
                yAxis: {
                    title: {
                        text: 'Negativity Quotient'
                    },
                    plotLines: [{
                        color: 'red',
                        value: thisAvg,
                        width: '2',
                        zIndex: '2'
                    }, {
                        color: 'blue',
                        value: thisStdDev,
                        width: '2',
                        zIndex: '2'
                    }],
                    min: 0,
                    max: 100
                },
                legend: {
                    enabled: false
                },
                series: [{
                    type: 'area',
                    name: 'Negativity Quotient',
                    data: allData.map(function (data) {
                        if (data.scores) {
                            return [Date.parse(data.time), data.scores.sadness * 100];
                        }
                        return [Date.parse(data.time), data.sadness * 100];
                    })
                }]
            });

            if (params.data.avg*100 < 15) {
                $('#4_panel').toggle();
                $('#four').toggle();
            }
            else if (params.data.avg*100 < 50) {
                $('#3_panel').toggle();
                $('#three').toggle();
            }
            else if (params.data.avg*100 < 75) {
                $('#2_panel').toggle();
                $('#two').toggle();
            }
            else {
                $('#1_panel').toggle();
                $('#one').toggle();
            }

            $(".conf h4").text("Confidence Interval: " + thisciFloor + " - "
                           + thisciCeil);

            console.log(allData);
        });
    }

    loadData();
