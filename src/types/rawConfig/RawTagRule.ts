interface AdvancedRawTagRule {
  applicableTo: string | string[];
  tag: string;
}

type RawTagRule = AdvancedRawTagRule | string;
export default RawTagRule;
