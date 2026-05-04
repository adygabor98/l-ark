import {
    gql,
    useQuery,
    type DocumentNode
} from '@apollo/client';

/** Return the endpoint depending on the type of elements the user wants */
const getRequestQuery = (type: string | undefined): DocumentNode => {
    switch(type) {
        default: return gql`query empty { __emtpy }`
    }
}

const CheckboxGroupInput = (props: any) => {
    /** Retrieve component properties */
    const { field, type, variables } = props;
    /** Request the information of the dropdown */
    const { data } = useQuery(getRequestQuery(type), {
        variables: variables
    });

    // Extract elements from query data
    const elements = data ? Object.values(data)[0] as any[] : [];

    /** Manage to update the items checked */
    const toggleValue = (val: string): void => {
        const newValue = (field.value ?? []).includes(val)
            ? (field.value ?? []).filter((v: string) => v !== val)
            : [...(field.value ?? []), val];
        field.onChange(newValue);
    };

      return (
        <div className="flex flex-wrap gap-3 pl-2">
            {elements.map((option: any) => {
                const isChecked = field.value?.includes(option.value);

                return (
                    <div
                        key={option.value}
                        onClick={() => toggleValue(option.value)}
                        className={`
                            shrink-0 flex-1 min-w-40 max-w-[220px] min-h-10 flex gap-2 items-center border-[0.5px] px-3 py-1.5 rounded-lg cursor-pointer select-none
                            ${isChecked ? 'border-neutral-600 bg-secondary' : 'border-neutral-400'}
                        }`}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${isChecked ? 'bg-neutral-700' : 'border border-neutral-600'}`} />
                    </div>
                );
            })}
        </div>
    );
}

export default CheckboxGroupInput