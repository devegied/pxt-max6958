/**
 * Seven segments LED Display Driver (MAX6958)
 * @author devegied
 */
//% weight=100 color=#FF0000 icon="8"
namespace MAX6958 {
    enum Regs {
        DecodeMode = 0x01,
        Intensity = 0x02,
        ScanLimit = 0x03,
        Config = 0x04,
        Test = 0x07,
        DigitBase = 0x20,
        Segments = 0x24
    }
    export enum ADDRESS {
        //% block="AA variant 0x38"
        AA38 = 0x38,
        //% block="BA variant 0x39"
        BA39 = 0x39
    }
    export enum MAXDIG0On {
        //% block="Left"
        Left = 0,
        //% block="Right"
        Right = 1
    }
    //                0     1     2     3     4     5     6     7     8     9     A     b     C     d     E     F
    const _NUMS = [0x7E, 0x30, 0x6D, 0x79, 0x33, 0x5B, 0x5F, 0x70, 0x7F, 0x7B, 0x77, 0x1F, 0x4E, 0x3D, 0x4F, 0x47];
    let not_initialized: boolean = true;
    let myAddress: uint8;
    let digCount: uint8;
    let myBrightness: uint8;
    let segReg: uint8;
    let digOrderMod: boolean;

    function writeRegister(register: Regs, value: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = register;
        buf[1] = value;
        pins.i2cWriteBuffer(myAddress, buf);
    }
    /**
     * turn on display.
     */
    //% blockId="MAX6958_on" block="turn on"
    //% weight=93 blockGap=8
    export function on(): void {
        if (not_initialized) default_init();
        writeRegister(Regs.Config, 0x01);
    }
    /**
     * turn off display.
     */
    //% blockId="MAX6958_off" block="turn off"
    //% weight=92 blockGap=8
    export function off(): void {
        if (not_initialized) default_init();
        writeRegister(Regs.Config, 0x00);
    }
    /**
     * clear display.
     */
    //% blockId="MAX6958_clear" block="clear"
    //% weight=94 blockGap=8
    export function clear(): void {
        if (not_initialized) default_init();
        writeRegister(Regs.Config, 0x21); // reset digit and dp/single led registers to 0 and turn on
        segReg = 0x00; //dp/single led are turned off
    }
    /**
     * light on or of separate leds
     * @param pos is the position, eg: 1
     * @param show is show/hide led, eg: true
     */
    //% blockId="MAX6958_showLED" block="LED at %pos|show %show"
    //% weight=95 blockGap=8
    //% pos.min=1 pos.max=4 pos.dflt=1
    export function showLED(pos: number = 1, show: boolean = true): void {
        if (not_initialized) default_init();
        if (show)
            segReg |= 0x01 << (pos - 1); //separate LEDS indexed from 0
        else
            segReg &= ~(0x01 << (pos - 1));
        writeRegister(Regs.Segments, segReg);
    }
    /**
     * show or hide dot point.
     * @param pos is the position, eg: 1
     * @param show is show/hide dp, eg: true
     */
    //% blockId="MAX6958_showDP" block="DotPoint at %pos|show %show"
    //% weight=96 blockGap=8
    //% pos.min=1 pos.max=4 pos.dflt=1
    export function showDP(pos: number = 1, show: boolean = true): void {
        showLED((digOrderMod ? (9 - pos) : (pos + 4)), show);//dot points are separate leds starting from 5th position
    }
    /**
     * light indicated segments at given position.
     * @param segments segments to light, eg: 0x7F
     * @param pos the position of the digit, eg: 1
     */
    //% blockId="MAX6958_lightsegmentsat" block="light segments %segments |at %pos"
    //% weight=97 blockGap=8 advanced=true
    //% segments.dflt=0x7F pos.min=1 pos.max=4 pos.dflt=1
    export function lightSegmentsAt(segments: number = 0x7F, pos: number = 1): void {
        if (not_initialized) default_init();
        writeRegister(Regs.DigitBase + (digOrderMod ? (4 - pos) : (pos - 1)), segments & 0x7F); //position in MAX6958 indexed from 0; only 7 bits needed
    }
    /**
     * show a digit at given position. 
     * @param num digit to be shown, eg: 5
     * @param pos the position of the digit, eg: 1
     */
    //% blockId="MAX6958_showdigitat" block="show digit %num |at %pos"
    //% weight=98 blockGap=8
    //% num.min=0 num.max=15 num.dflt=5 pos.min=1 pos.max=4 pos.dflt=1
    export function showDigitAt(num: number = 5, pos: number = 1): void {
        if (not_initialized) default_init();
        writeRegister(Regs.DigitBase + (digOrderMod?(4-pos):(pos-1)), _NUMS[num % 16]);//position in MAX6958 indexed from 0
    }

    function showIntBase(num: number, base: number): void {
        let minpos = 1;
        let leftVal;
        if (num <= -(base ** (digCount - 1)) || num >= base ** digCount) { // overflow
            for (let mpos = digCount; mpos >= minpos; mpos--)
                lightSegmentsAt(0x01, mpos); // '-'
            return;
        }
        if (num < 0) {
            lightSegmentsAt(0x01, 1); // '-'
            leftVal = -num;
            minpos++;
        } else {
            leftVal = num;
        }
        for (let dpos = digCount; dpos >= minpos; dpos--) {
            if (leftVal > 0 || (dpos == digCount && num == 0))
                showDigitAt(leftVal % base, dpos);
            else
                lightSegmentsAt(0, dpos); // no segments
            leftVal = Math.idiv(leftVal, base);
        }
    }
    /**
     * show a decimal integer number between -999 and 9999 
     * @param num is a number, eg: 1234
     */
    //% blockId="MAX6958_shownum" block="show number %num"
    //% weight=99 blockGap=8
    export function showInteger(num: number): void {
        showIntBase(num, 10);
    }
    /**
     * show a hex number between -0x0FFF and 0xFFFF
     * @param num is a hex number, eg: 0
     */
    //% blockId="MAX6958_showhex" block="show hex number %num"
    //% weight=90 blockGap=8
    export function showHex(num: number): void {
        showIntBase(num, 16);
    }

    function internal_init(intensity: number, count: number, address: number, maxDig0On: number): void {
        not_initialized = false;
        myBrightness = intensity;
        myAddress = address;
        digCount = count;
        digOrderMod = (maxDig0On == MAXDIG0On.Right);
        let buf = pins.createBuffer(5);
        buf[0] = Regs.DecodeMode;
        buf[1] = 0; // disable decode mode for all digits
        buf[2] = myBrightness; // intensity
        buf[3] = digCount - 1; // connected digits count
        buf[4] = 0x21; // reset digit and dp/single led registers to 0 and turn on
        pins.i2cWriteBuffer(myAddress, buf);
        segReg = 0x00; //dp/single led are turned off
    }

    function default_init(): void {
        internal_init(5/*intensity*/, 4/*count*/, ADDRESS.AA38, MAXDIG0On.Left);
    }
    /**
     * initialize Digit Display Driver (MAX6958)
     * @param intensity the brightness of the LED, eg: 5
     * @param count the count of digits, eg: 4
     * @param address the i2c bus address of driver, eg: 0x38
     */
    //% weight=200 blockGap=8
    //% blockId="MAX6958_init" block="init with brightness %intensity|digit count %count||i2c address %address|digit 0 position on the %maxDig0On"
    //% inlineInputMode=inline count.min=1 count.max=4 count.dflt=4 intensity.min=0 intensity.max=63 intensity.dflt=5
    //% address.min=0x38 address.max=0x39 address.dflt=0x38 maxDig0On.min=0 maxDig0On.max=1 maxDig0On.dflt=0 
    export function init(intensity: number = 5, count: number = 4, address: ADDRESS = 0x38, maxDig0On: MAXDIG0On = MAXDIG0On.Left): void {
        internal_init(intensity, count, address, maxDig0On);
    }
}