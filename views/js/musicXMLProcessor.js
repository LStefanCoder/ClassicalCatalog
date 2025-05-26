async function loadScore(ID)
{
    var musicXMLString;

    var searchTerm = 'SELECT XML FROM MusicPieces WHERE ID = ' + ID;

    const DBtempopen = new sql3.Database('music.db', sql3.OPEN_READONLY);
    var queryResult;

    await DBtempopen.get(searchTerm, (error, row) => {
    queryResult = row;
    });

    await delay(100);

    musicXMLString = queryResult;

    var osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("div-container", {
        autoResize: true, // just an example for an option, no option is necessary.
        backend: "svg",
        drawTitle: true,
        // put further options here
      });
    
    //see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Getting-Started
    var loadPromise = osmd.load(musicXMLString);
    
    loadPromise.then(function(){
        osmd.render();
    });
}


//temporary delay
function delay(time) {
    return new Promise(function(resolve) { 
    setTimeout(resolve, time)
    });
}