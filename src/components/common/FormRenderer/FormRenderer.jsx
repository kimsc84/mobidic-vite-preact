import { h } from 'preact';
import { useState, useEffect, useCallback }
from 'preact/hooks';
import FormFieldWrapper from '../FormFieldWrapper/FormFieldWrapper.jsx';
import Input from '../Input/Input.jsx';
import Textarea from '../Textarea/Textarea.jsx';
import Select from '../Select/Select.jsx';
import TableField from '../../dialog/fields/TableField.jsx'; // Path for TableField is different
import Checkbox from '../Checkbox/Checkbox.jsx'; // Corrected path
import RadioGroup from '../RadioGroup/RadioGroup.jsx'; // Corrected path
import CheckboxGroup from '../CheckboxGroup/CheckboxGroup.jsx'; // Corrected path


/**
 * @typedef FormRendererProps
 * @property {Array<object>} fields - Array of field definitions, similar to dialogTemplates.
 * @property {object} [initialData] - Initial data for the form fields.
 * @property {'mixed-flex' | '2-column-grid' | string} [layout='mixed-flex'] - Layout type for the form.
 * @property {function} [onSubmit] - Callback function when the form is submitted (e.g., by an external button). Receives form data.
 * @property {string} [formId] - A unique ID for the form, useful for context if multiple forms are on a page.
 * @property {import('preact').ComponentChildren} [children] - Optional children, could include a submit button.
 * @property {function} [onFormDataChange] - Optional callback that receives the full form data whenever it changes.
 */

const findLongestLabelFromTemplate = (fieldsArray) => {
  let longestLabelText = "";
  let maxLength = 0;
  if (fieldsArray && Array.isArray(fieldsArray)) {
    fieldsArray.forEach((field) => {
      const isExplicitlyVertical = field.layout === 'vertical';
      const isCustomVerticalType = ['table', 'image-upload', 'customHtml', 'checkbox', 'radio-group', 'checkbox-group'].includes(field.type);
      const considerForLength = !isExplicitlyVertical && !isCustomVerticalType && field.label && typeof field.label === 'string';

      if (considerForLength) {
        const currentLength = field.label.length;
        if (currentLength > maxLength) {
          maxLength = currentLength;
          longestLabelText = field.label;
        }
      }
    });
  }
  return { text: longestLabelText, length: maxLength };
};

const FormRenderer = (props) => {
  const {
    fields = [],
    initialData = {},
    layout = 'mixed-flex',
    onSubmit,
    formId = 'formRenderer',
    children,
    onFormDataChange,
  } = props;

  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const newFormData = {};
    fields.forEach(field => {
      let valueToSet;
      if (initialData && initialData.hasOwnProperty(field.id)) {
        valueToSet = initialData[field.id];
      } else if (field.hasOwnProperty('defaultValue')) {
        valueToSet = field.defaultValue;
      } else if (field.type === 'table') {
        valueToSet = field.rows || [];
      } else if (field.type === 'checkbox') {
        valueToSet = field.checked || false; 
      } else if (field.type === 'radio-group') {
        valueToSet = field.value || ''; 
      } else if (field.type === 'checkbox-group') {
        valueToSet = field.value || []; 
      } else {
        valueToSet = '';
      }
      newFormData[field.id] = valueToSet;
    });
    setFormData(newFormData);
    setValidationErrors({});
  }, [fields, initialData]);

  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const handleInputChange = useCallback((fieldId, value) => {
    setFormData(prevData => ({ ...prevData, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors(prevErrors => ({ ...prevErrors, [fieldId]: undefined }));
    }
  }, [validationErrors]);

  const validate = useCallback(() => {
    const errors = {};
    let isValid = true;
    fields.forEach(field => {
      const value = formData[field.id];
      if (field.required) {
        let isEmpty = false;
        if (field.type === 'table' || field.type === 'checkbox-group') {
            isEmpty = !value || value.length === 0;
        } else if (field.type === 'checkbox') {
            isEmpty = !value; 
        } else {
            const trimmedValue = typeof value === 'string' ? value.trim() : value;
            isEmpty = trimmedValue === undefined || trimmedValue === null || String(trimmedValue).trim() === '';
        }
        if (isEmpty) {
           errors[field.id] = field.errorMessage || 'This field is required.';
           isValid = false;
        }
      }
      if (isValid && field.validate && typeof field.validate === 'function') {
        const customValidationResult = field.validate(value, formData);
        if (customValidationResult !== true) {
          errors[field.id] = typeof customValidationResult === 'string' ? customValidationResult : (field.errorMessage || 'Invalid input.');
          isValid = false;
        }
      }
    });
    setValidationErrors(errors);
    return isValid;
  }, [formData, fields]);

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (validate()) {
      if (onSubmit) {
        onSubmit(formData);
      } else {
        console.warn('[FormRenderer] onSubmit prop not provided. Form data:', formData);
      }
    }
  }, [validate, onSubmit, formData]);

  const longestLabelInfo = findLongestLabelFromTemplate(fields);
  const calculatedMinWidthEm = Math.max(6, longestLabelInfo.length * 0.7 + 2);
  const formStyle = { '--form-label-min-width': `${calculatedMinWidthEm.toFixed(2)}em` };

  let formDivClasses = "form-renderer-root";
  if (layout === "2-column-grid") {
    formDivClasses += " form form--layout-2-column-grid";
    formStyle.display = 'grid';
  } else if (layout === "mixed-flex") {
    formDivClasses += " form form--layout-mixed-flex";
    formStyle.display = 'flex';
    formStyle.flexWrap = 'wrap';
  } else {
    formDivClasses += " form";
  }
  
  return (
    <div
      id={formId}
      class={formDivClasses}
      role="form"
      aria-labelledby={`${formId}-title`}
      style={formStyle}
    >
      {fields.map(field => {
        const uniqueFieldId = `${formId}_${field.id}`;
        const uniqueFieldName = `${formId}_${field.name || field.id}`;
        const fieldType = field.type || 'default';
        const value = formData[field.id];

        const wrapperLabel = fieldType === 'checkbox' ? null : field.label;
        const isFieldVertical = field.layout === 'vertical' || ['table', 'image-upload', 'customHtml', 'checkbox', 'radio-group', 'checkbox-group'].includes(fieldType);

        if (field.readonly && field.format && fieldType !== 'table') { // TableField handles its own readonly display
            const displayValue = value !== undefined && value !== null ? String(value) : (field.placeholder || '');
            return (
                <FormFieldWrapper
                    key={field.id}
                    label={wrapperLabel}
                    required={field.required}
                    isVertical={isFieldVertical}
                    fieldId={field.id}
                    colSpan={field.colSpan}
                    flexStyle={field.flexStyle}
                    dialogLayout={layout} 
                    disabled={field.disabled || field.readonly}
                >
                    <span class="field__readonly-value" id={uniqueFieldId}>
                        {displayValue}
                    </span>
                </FormFieldWrapper>
            );
        }

        let control = null;
        const commonProps = {
          id: uniqueFieldId,
          name: uniqueFieldName,
          placeholder: field.placeholder,
          disabled: field.disabled || field.readonly, // Correctly use combined disabled/readonly
          readOnly: field.readonly,
          required: field.required,
          "aria-describedby": `${uniqueFieldId}-error`,
        };
        
        if (fieldType === 'checkbox') {
          control = (
            <Checkbox
              {...commonProps} // Uses commonProps.disabled
              label={field.label} 
              checked={!!value}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
            />
          );
        } else if (fieldType === 'radio-group') {
          control = (
            <RadioGroup
              {...commonProps} // Uses commonProps.disabled
              options={field.options}
              selectedValue={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          );
        } else if (fieldType === 'checkbox-group') {
          control = (
            <CheckboxGroup
              {...commonProps} // Uses commonProps.disabled
              options={field.options}
              selectedValues={value || []}
              onChange={(e, val, isChecked) => {
                const currentValues = formData[field.id] || [];
                const newValues = isChecked ? [...currentValues, val] : currentValues.filter(v => v !== val);
                handleInputChange(field.id, newValues);
              }}
            />
          );
        } else if (fieldType === 'text' || fieldType === 'default' || fieldType === 'date' || fieldType === 'email' || fieldType === 'password' || fieldType === 'number' || fieldType === 'url' || fieldType === 'tel' || fieldType === 'datetime' || fieldType === 'month' || fieldType === 'year') {
          let inputType = field.inputType || 'text';
          if (['date', 'email', 'password', 'number', 'url', 'tel'].includes(fieldType)) inputType = fieldType;
          else if (fieldType === 'datetime') inputType = 'datetime-local';
          else if (fieldType === 'month') inputType = 'month';
          else if (fieldType === 'year') inputType = 'number';
          control = (
            <Input
              {...commonProps} // Uses commonProps.disabled
              type={inputType}
              value={value || ''}
              onInput={(e) => handleInputChange(field.id, e.target.value)}
            />
          );
        } else if (fieldType === 'textarea') {
          control = (
            <Textarea
              {...commonProps} // Uses commonProps.disabled
              value={value || ''}
              rows={field.rows}
              onInput={(e) => handleInputChange(field.id, e.target.value)}
            />
          );
        } else if (fieldType === 'select') {
          control = (
            <Select
              {...commonProps} // Uses commonProps.disabled
              value={value || ''}
              options={field.options}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          );
        } else if (fieldType === 'table') {
           control = (
             <TableField
               field={field}
               rows={formData[field.id] || []}
               dialogType={formId} 
               uniqueFieldId={uniqueFieldId}
               disabled={commonProps.disabled} // Uses commonProps.disabled
             />
           );
        } else {
          control = <p>Unsupported field type: {fieldType}</p>;
        }

        return (
          <FormFieldWrapper
            key={field.id}
            label={wrapperLabel}
            labelFor={uniqueFieldId}
            required={field.required}
            errorMessage={validationErrors[field.id]}
            uniqueErrorSpanId={`${uniqueFieldId}-error`}
            isVertical={isFieldVertical}
            fieldId={field.id}
            colSpan={field.colSpan}
            flexStyle={field.flexStyle}
            dialogLayout={layout} 
            disabled={commonProps.disabled} // Pass combined disabled state to wrapper
          >
            {control}
          </FormFieldWrapper>
        );
      })}
      {children}
    </div>
  );
};

export default FormRenderer;
