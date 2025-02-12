import React, { useEffect } from "react";
import { buildProperty, FieldHelperText, FieldProps, Paper, PropertyFieldBinding } from "@firecms/firebase_pro";

/**
 * Simple map field to test validation of custom fields
 */
export const CustomField = ({
                                property,
                                value,
                                propertyKey,
                                tableMode,
                                error,
                                showError,
                                includeDescription,
                                context,
                                setValue
                            }: FieldProps<Record<string, any>>) => {
    useEffect(() => {
        if (!value) setValue({});
    }, [value, setValue]);

    const fieldProps = {
        propertyKey: `${propertyKey}.sample`,
        property: buildProperty({
            name: "Sample",
            dataType: "string",
            validation: {
                required: true
            }
        }),
        context
    };

    return (
        <>
            <Paper>
                <PropertyFieldBinding {...fieldProps}/>
            </Paper>

            <FieldHelperText includeDescription={includeDescription}
                             showError={showError}
                             error={error}
                             property={property}/>

        </>
    );
};
