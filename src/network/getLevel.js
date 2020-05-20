import {getOS, getBrowser} from './getOS';
import {LoadXML} from './xhttp';

export function getLevels(){
    $.post('php/get_level_list.php',{
        time: new Date().toLocaleTimeString(),
        OS: getOS(),
        browser: getBrowser(),
    },
    function(data, status){
        console.log("Data: " + data + "\nStatus: " + status);
    })
}

export function getLastLevel(callback){
    $.post('php/get_last_level.php',{
        time: new Date().toLocaleTimeString(),
        OS: getOS(),
        browser: getBrowser(),
    },
    function(data, status){
        console.log("Data: " + data + "\nStatus: " + status);
        LoadXML(callback, data + '.xml');
    });
}

export function getRandomLevel(callback){
    $.post('php/get_rand_level.php',{
        time: new Date().toLocaleTimeString(),
        OS: getOS(),
        browser: getBrowser(),
    },
    function(data, status){
        console.log("Data: " + data + "\nStatus: " + status);
        LoadXML(callback, 'levels/' +  data + '.xml', false);
    });
}

// export function getRandomLevel(callback){
//     $.get('php/get_rand_level.php',{
//         time: new Date().toLocaleTimeString(),
//         OS: getOS(),
//         browser: getBrowser(),
//     },
//     function(data, status){
//         console.log("Data: " + data + "\nStatus: " + status);
//         LoadXML(callback, 'levels/' +  data + '.xml', true);
//     });
// }