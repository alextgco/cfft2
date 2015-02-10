var async = require('async');
var request = require('request');
// Library dependencies
var mysql = require('mysql'),
    mysqlUtilities = require('mysql-utilities');



var start = function(){
    async.series([
        getCities,
        open/*,
        clearTables,
        insertData*/
        //createCities
        /*,
         createCountries*/
    ], function (err) {
        /*console.log(countries[0]);
        console.log(cities[1]);*/
        /*connection.end(function(err) {
            if (err){
                console.log(err);
            }else{
                console.log('connection end succesfull');
            }

            // The connection is terminated now
        });*/
        connection.destroy(function(err){
            if (err){
                console.log(err);
            }else{
                console.log('connection end succesfull');
            }
        });
        console.log('script end');
    });
};
start();
var connection;
function open(callback) {
    /*connection = mysql.createConnection({
        host: '173.194.241.167',
        user: 'dep55rmncbf',
        password: '73cpVxsBmNj9',
        database: 'dep55rmncbf'
    });*/
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'aambfi5y',
        database: 'cfft'
    });
    connection.connect();


// Mix-in for Data Access Methods and SQL Autogenerating Methods
    mysqlUtilities.upgrade(connection);

// Mix-in for Introspection Methods
    mysqlUtilities.introspection(connection);
    console.log('open');
    callback();
}
function getCountriesPortion(offset,callback){
    offset = offset || 0;
    var url = 'http://api.vk.com/method/database.getCountries?v=5.5&need_all=1&offset='+offset+'&count=1000&code=RU';
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            var items = res.response.items;
            for (var i in items) {
                countries.push(items[i]);
            }
        }
        callback();
    })
}
function getCitiesPortion(country_id,offset,callback){
    offset = offset || 0;
    var country;
    for (var i in countries) {
        if (countries[i].id==country_id){
            country = countries[i];
            break;
        }
    }

    cities[country_id] = cities[country_id] || [];

    var url = 'http://api.vk.com/method/database.getCities?country_id='+country_id+'&v=5.5&need_all=1&offset='+offset+'&count=1000';
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            //cities = res.response.items;
            var counter = 0;
            var items = res.response.items;
            for (var i in items) {
                items[i].country_id = country_id;
                items[i].country_title = country.title;
                cities[country_id].push(items[i]);
                counter++;
                /*if (cities[country_id].length>100){
                    return callback();
                }*/
            }
            if (counter==1000){
                offset +=1000;
                return getCitiesPortion(country_id,offset,callback);
            }else{
                console.log('length',cities[country_id].length);
                callback();
            }
        }else{
            callback();
        }
    })
}
function getCities(callback) {
    getCountriesPortion(0, function () {
        async.each(countries, function (item, callback) {
            getCitiesPortion(item.id, 0, function () {

                callback();
            })
        }, callback);
    });
}
function clearTables(callback){
    var tables = ['countries','cities'];
    console.log('clearTables START');
    async.each(tables,function(item,callback){
        console.log(item);
        connection.delete(item,{title:'*'},function(err,affectedRow){
            if (err){
                console.log(err);
            }
            console.log(item+' cleared');
            callback();
        });
    },callback);
}

function insertData(callback){
    async.eachSeries(countries,function(country,callback){
        var countriId = country.id;
        connection.insert('countries',{
            title:country.title,
            external_id: countriId
        },function(err,recordId){
            var counter = 0;
            var countK = 0;
            if (err){
                console.log(err);
            }
            console.log(country.title);
            async.eachSeries(cities[countriId],function(city,callback){
                connection.insert('cities',{
                    title:city.title,
                    country_id:recordId,
                    important:city.important
                },function(err,cityId){
                    if(err){
                        console.log(err);
                    }
                    counter++;
                    if (counter==1000){
                        countK++;
                        console.log('Добавлено',countK +'тыс.');
                        counter = 0;
                    }
                    callback();
                })
            },callback);
        })
    },callback);
}




var countries = [];
var cities = [];

/*// Do something using utilities
connection.queryRow(
    'SELECT * FROM test',
    function(err, row) {
        console.dir({queryRow:row});
    }
);*/

// Release connection
