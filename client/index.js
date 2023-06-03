const commonWords = ["a","aboard","about","above","across","after","against","along","amid","among","an","and","around","as","at",
    "because","before","behind","below","beneath","beside","between","beyond","but","by","concerning","considering","despite",
    "down","during","except","following","for","from","if", "i", "in","inside","into","is","it","like","minus","near","next",
    "of","off","on","onto","opposite","or","out","outside","over","past","per","plus","regarding","round","save","since","than",
    "the","through","till","to","toward","under","underneath","unlike","until","up","upon","versus","via","was","with","within","without",
    "you", "he", "she", "they", "his", "her", "their", "they're", "we", "my", "your", "our", "yours", "ours", "this", "that",
]

var baffled = {};
var bCount = 0;
var guesses = [];
var guessCount = 0;
var authorFirst = "";
var authorLast = "";
var answer = "";
var answerKeywords = [];

function getpage99(text){
    lines = text.split('\n');
    page99 = 46 * 99;
    lines = lines.slice(page99, page99 + (3 * 46))
    return lines.join('\n');
}

function wrapwords(text){
    output = ""
    lines = text.split('\n');
    lines.forEach(line => {
        words = line.split(/([\.,:()\[\]?!;`\~\-\u2013\—&*"\s])/);
        words.forEach(word => {
            if (!commonWords.includes(word.toLowerCase()) 
                && word.trim().length > 0
                && /^[a-zA-Z']+$/.test(word)){
                output += `<span class="baffled" id="b${bCount}">${word}</span>`
                bCount++;
            }
            else{
                output += `<span>${word}</span>`
            }
        });
        output +="<br>"
    });
    return output
}

function parseText(text){
    page = getpage99(text);
    html = wrapwords(page);
    return html
}

function tokenizeWord(word) {
    word = word.trim().toLowerCase();

    if (word.endsWith("'s"))
        word = word.substring(0, word.length - 2);
    
    return word;
}

function baffleElement(elem){
    let token = tokenizeWord(elem.text());
    let id = elem.attr('id');
    let b = baffle(`#${id}`).once();
    baffled[id] = {
        baffle: b,
        token: token
    }
}

function revealWords() {
    for(key in baffled){
        let b = baffled[key].baffle;
        if(b.running){
            b.reveal()
        }
    }
    $('#author > #firstinitial').addClass('d-none');
    $('#author > #lastinitial').addClass('d-none');
}

function hasWon(guess){
    if (guess === answer)
        return true;
    if (answerKeywords.filter((word) => {
        return !guesses.includes(word)
    }).length == 0)
        return true
    return false
}

function giveHelp(){
    if(guessCount == 1) {
        baffled['year'].baffle.reveal()
        $('#year').removeClass('baffled');
    }
    if(guessCount == 50 && !guesses.includes(authorFirst.toLowerCase())) {
        $('#author > #firstinitial').removeClass('d-none');
    }
    if(guessCount == 50 && !guesses.includes(authorLast.toLowerCase())) {
        $('#author > #lastinitial').removeClass('d-none');
    }
    if(guessCount == 75) {
        $('#summary').removeClass('d-none');
    }
}

function authorNameGuess(guess){
    if(guess === authorFirst.toLowerCase())
        $('#author > #firstinitial').addClass('d-none');
    if(guess === authorLast.toLowerCase())
        $('#author > #lastinitial').addClass('d-none');
}

function checkGuess(guess){
    var hits = 0;
    guessCount++;
    guessToken = tokenizeWord(guess);
    if (guess in guesses)
        return;

    for (key in baffled){
        if (baffled[key].token === guess){
            baffled[key].baffle.reveal();
            $(`#${key}`).removeClass('baffled');
            hits ++;
        }

    }
    $('#guesses').prepend(`<tr><td>${guessCount}</td><td>${guess}</td><td>${hits}</td></tr>`);
    guesses.push(guess);

    if(hasWon(guess)){
        $('#gamewon').modal('show');
        revealWords();
    }

    authorNameGuess(guess);
    giveHelp();
}

function initializeContent(data, text){
    answer = data.title.trim().toLowerCase();
    answerKeywords = answer.split(' ').filter((word) => {
        return !commonWords.includes(word)
    }).map((word) => tokenizeWord(word));

    authorFirst = data.author.first_name;
    authorLast = data.author.last_name;

    $('#title').html(wrapwords(data.title));
    $('#author > #firstname').html(authorFirst);
    $('#author > #firstinitial').html(authorFirst.slice(0, 1));
    $('#author > #lastname').html(authorLast);
    $('#author > #lastinitial').html(authorLast.slice(0, 1));
    $('#year').html(data.year_published);
    $('#summary').html(data.summary);
    $('#text').html(parseText(text));
    
    $('.baffled').each(function () {
        baffleElement($(this))
    });

}

window.onload = function(){
    Promise.all([
        fetch('/books/1/metadata.json'),
        fetch('/books/1/text.txt')])
        .then(([metadataResponse, textResponse]) => {
            Promise.all([
                metadataResponse.json(),
                textResponse.text()
            ]).then(([data, text]) => {
                initializeContent(data, text);
            }).catch((err) => {
                console.log(err);
            });
        }).catch((err) => {
            console.log(err);
        });

    $("#submitGuess").click(function(){
        if (!document.getElementById("guessinput").value == '' 
            || !document.getElementById("guessinput").value == document.getElementById("guessinput").defaultValue) {
            var guess = tokenizeWord(document.getElementById("guessinput").value);

            checkGuess(guess);
            $("#guessinput").val('');
        }
    });
    $('#guessinput').keyup(function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if(keycode == '13'){
                $("#submitGuess").click();
            }
    }); 
}