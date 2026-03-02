export type TFormPrefill = {
  spec: {
    customizationId: string
    values: {
      path: (string | number)[]
      value: unknown
    }[]
  }
}

export type TRangeInputCustomValue =
  | {
      type: 'number'
      value: number
    }
  | {
      type: 'substractResourceValues'
      firstValueUri: string
      firstValuesKeysToValue: string | string[] // jsonpath or keys as string[]
      secondValueUri: string
      secondValuesKeysToValue: string | string[] // jsonpath or keys as string[]
    }
  | {
      type: 'addResourceValues'
      firstValueUri: string
      firstValuesKeysToValue: string | string[] // jsonpath or keys as string[]
      secondValueUri: string
      secondValuesKeysToValue: string | string[] // jsonpath or keys as string[]
    }
  | {
      type: 'resourceValue'
      valueUri: string
      keysToValue: string | string[] // jsonpath or keys as string[]
    }

export type TRangeInputCustomValuesBlock = {
  min: TRangeInputCustomValue
  max: TRangeInputCustomValue
  step: number
}

export type TRangeInputCustomProps = {
  logic: 'memoryLike' | 'cpuLike'
  add: TRangeInputCustomValuesBlock
  edit: TRangeInputCustomValuesBlock
}

export type TListInputCustomProps = {
  valueUri: string
  keysToValue: string | string[] // jsonpath or keys as string[]
  keysToLabel?: string | string[] // jsonpath or keys as string[]
  mode?: 'multiple' | 'tags'
  criteria?: {
    keysToValue: string | string[] // jsonpath or keys as string[]
    type: 'equals' | 'notEquals'
    value: unknown
    keepPrefilled?: boolean
  }
  relatedValuePath?: string
  allowEmpty?: boolean
  persistType?: 'str' | 'number' | 'arr' | 'obj'
}
