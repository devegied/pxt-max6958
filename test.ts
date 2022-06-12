let item = 0;
let startFinished = 0;
MAX6958.init(5, 4);
for (let pos1 = 0; pos1 <= 7; pos1++) {
    MAX6958.showLED(pos1 + 1, true);
    basic.pause(500);
    MAX6958.showLED(pos1 + 1, false);
}
for (let pos2 = 0; pos2 <= 3; pos2++) {
    for (let seg = 0; seg <= 6; seg++) {
        MAX6958.lightSegmentsAt(2 ** seg, pos2 + 1);
        basic.pause(500);
    }
    MAX6958.lightSegmentsAt(0, pos2 + 1);
}
for (let pos3 = 0; pos3 <= 4; pos3++) {
    item += 10 ** pos3;
    MAX6958.showInteger(item * -8);
    basic.pause(500);
    MAX6958.showInteger(item * 8);
    basic.pause(500);
}
item = 0;
MAX6958.showInteger(item);
basic.pause(1000);
startFinished = 1;
basic.forever(function () {
    if (startFinished == 1) {
        item += 1;
        MAX6958.showInteger(item);
        basic.pause(1000);
    }
})
