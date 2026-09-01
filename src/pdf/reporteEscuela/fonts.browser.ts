import ls700 from "../fonts/LeagueSpartan-Bold.ttf";
import ls800 from "../fonts/LeagueSpartan-ExtraBold.ttf";
import m400 from "../fonts/Montserrat-Regular.ttf";
import m500 from "../fonts/Montserrat-Medium.ttf";
import m600 from "../fonts/Montserrat-SemiBold.ttf";
import m700 from "../fonts/Montserrat-Bold.ttf";
import m700i from "../fonts/Montserrat-BoldItalic.ttf";
import { registerFonts } from "./fonts";

export function registerFontsBrowser() {
  registerFonts({ ls700, ls800, m400, m500, m600, m700, m700i });
}
