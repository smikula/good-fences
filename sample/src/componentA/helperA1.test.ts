import helperB1 from '../componentB/helperB1'; // INVALID IMPORT in regular code, but valid in test code

export default function helperA1() {
    helperB1();
}
