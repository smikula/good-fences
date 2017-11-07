import componentB from '../componentB/componentB';
import helperA1 from './helperA1';
import helperA2 from './helperA2';

export default function componentA() {
    componentB();
    helperA1();
    helperA2();
}
