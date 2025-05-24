import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import dialogTemplates from './dialogTemplates.js';
import { Button } from '../../components/common/Button/Button.jsx';
import { ICONS } from './iconUtils.js';
import FormFieldWrapper from '../../components/common/FormFieldWrapper/FormFieldWrapper.jsx';
import Input from '../../components/common/Input/Input.jsx';
import Textarea from '../../components/common/Textarea/Textarea.jsx';
import Select from '../../components/common/Select/Select.jsx';
import TableField from './fields/TableField.jsx';
import Checkbox from '../../components/common/Checkbox/Checkbox.jsx';
import RadioGroup from '../../components/common/RadioGroup/RadioGroup.jsx';
import CheckboxGroup from '../../components/common/CheckboxGroup/CheckboxGroup.jsx';

/**
 * @typedef DialogManagerProps
 * @property {string} dialogType - The type of dialog to render, mapping to dialogTemplates.
 * @property {boolean} isOpen - Whether the dialog should be open.
 * @property {function} onClose - Callback function when the dialog requests to be closed.
 * @property {function} onSubmit - Callback function when the dialog form is submitted.
 * @property {object} [initialData] - Initial data for the form fields.
 * @property {string} [dialogWidth] - Custom width for the dialog.
 * @property {string} [dialogHeight] - Custom height for the dialog.
 * @property {object} [options] - Additional options that might include initialData, dialogWidth, dialogHeight, custom callbacks, and tableActionCallback.
 * @property {function} [tableActionCallback] - Callback for table actions.
 */

const findLongestLabelFromTemplate = (templateObject) => {
  let longestLabelText = "";
  let maxLength = 0;
  if (templateObject && Array.isArray(templateObject.fields)) {
    templateObject.fields.forEach((field) => {
      const isExplicitlyVertical = field.layout === 'vertical';
      // Checkbox is typically rendered with its label by its side, not above by FormFieldWrapper
      const isCustomVerticalType = ['table', 'image-upload', 'customHtml', 'checkbox'].includes(field.type);
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

const DialogManagerComponent = (props) => {
  const {
    dialogType,
    isOpen,
    onClose: onCloseProp,
    onSubmit: onSubmitProp,
    initialData: propsInitialData,
    dialogWidth: propsDialogWidth,
    dialogHeight: propsDialogHeight,
    options = {},
    tableActionCallback: propsTableActionCallback
  } = props;

  const template = dialogTemplates[dialogType];
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentInitialData = propsInitialData || options.initialData || {};

  useEffect(() => {
    if (isOpen && template && template.fields) {
      const newFormData = {};
      template.fields.forEach(field => {
        let valueToSet;
        if (currentInitialData && currentInitialData.hasOwnProperty(field.id)) {
          valueToSet = currentInitialData[field.id];
        } else if (field.hasOwnProperty('defaultValue')) {
          valueToSet = field.defaultValue;
        } else if (field.type === 'table') {
          valueToSet = field.rows || [];
        } else if (field.type === 'checkbox') { // Individual checkbox
          valueToSet = field.checked || false; // Default to false if not specified
        } else if (field.type === 'radio-group') {
          valueToSet = field.value || ''; // Default to empty or first option
        } else if (field.type === 'checkbox-group') {
          valueToSet = field.value || []; // Default to empty array
        } else {
          valueToSet = '';
        }
        newFormData[field.id] = valueToSet;
      });
      setFormData(newFormData);
      setValidationErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, dialogType, template, currentInitialData]);

  const handleInputChange = useCallback((fieldId, value) => {
    setFormData(prevData => ({ ...prevData, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleTableAction = useCallback((actionName, details) => {
    const callback = propsTableActionCallback || options.callbacks?.onTableAction;
    if (callback && typeof callback === 'function') {
        try {
            callback(actionName, { ...details, dialogType });
        } catch (error) {
            console.error(`[DialogManagerComponent] tableActionCallback for action '${actionName}' execution error:`, error);
        }
    } else {
        console.log('[DialogManagerComponent] Table Action (no callback defined):', actionName, details);
    }
  }, [propsTableActionCallback, options.callbacks, dialogType]);

  const validateForm = useCallback(() => {
    if (!template || !template.fields) return true;
    const errors = {};
    let isValid = true;
    template.fields.forEach(field => {
      const value = formData[field.id];
      if (field.required) {
        let isEmpty = false;
        if (field.type === 'table' || field.type === 'checkbox-group') {
            isEmpty = !value || value.length === 0;
        } else if (field.type === 'checkbox') {
            isEmpty = !value; // For single checkbox, value should be true
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
  }, [formData, template]);

  const handleFormSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (validateForm()) {
      if (onSubmitProp) {
        setIsSubmitting(true);
        try {
          await onSubmitProp(dialogType, formData);
          if (onCloseProp) onCloseProp();
        } catch (error) {
          console.error('[DialogManagerComponent] onSubmitProp callback execution error:', error);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        console.warn('[DialogManagerComponent] onSubmitProp not provided.');
      }
    }
  }, [validateForm, onSubmitProp, dialogType, formData, onCloseProp]);

  const handleFooterAction = useCallback(async (actionDef) => {
    const actionName = actionDef.action;
    const context = { dialogType, formData, closeDialog: onCloseProp };
    if (actionName === 'submit') {
      await handleFormSubmit();
    } else if (actionName === 'cancel' || actionName === 'close') {
      if (onCloseProp) onCloseProp();
    } else if (actionName) {
      let customActionHandled = false;
      if (options.callbacks && typeof options.callbacks[actionName] === 'function') {
        try {
          await options.callbacks[actionName](context);
          customActionHandled = true;
        } catch (error) {
          console.error(`[DialogManagerComponent] Custom footer action '${actionName}' from options.callbacks execution error:`, error);
        }
      } else if (props[actionName] && typeof props[actionName] === 'function') {
        try {
          await props[actionName](context);
          customActionHandled = true;
        } catch (error) {
          console.error(`[DialogManagerComponent] Custom footer action '${actionName}' from props execution error:`, error);
        }
      }
      if (!customActionHandled) {
        console.warn(`[DialogManagerComponent] No handler for custom action: ${actionName}`);
      }
    }
  }, [handleFormSubmit, onCloseProp, props, options, dialogType, formData]);

  const dialogStyle = {};
  const widthToApply = propsDialogWidth || options.dialogWidth || template?.dialogWidth;
  const heightToApply = propsDialogHeight || options.dialogHeight || template?.dialogHeight;
  if (widthToApply) dialogStyle.width = widthToApply;
  if (heightToApply) dialogStyle.height = heightToApply;

  const handleDialogNativeClose = useCallback(() => {
    if (onCloseProp) onCloseProp();
  }, [onCloseProp]);

  if (!isOpen) return null;
  if (!template) {
    console.error(`[DialogManagerComponent] Template not found for type: ${dialogType}`);
    return null;
  }

  const longestLabelInfo = findLongestLabelFromTemplate(template);
  const calculatedMinWidthEm = Math.max(6, longestLabelInfo.length * 0.7 + 2);
  const formStyle = { '--form-label-min-width': `${calculatedMinWidthEm.toFixed(2)}em` };
  let formClasses = "form";
  if (template.dialogLayout === "2-column-grid") formClasses += " form--layout-2-column-grid";
  else if (template.dialogLayout === "mixed-flex") {
    formClasses += " form--layout-mixed-flex";
    formStyle.display = 'flex';
    formStyle.flexWrap = 'wrap';
  }

  const mapButtonProps = useCallback((btnDef, specificOnClick) => {
    const buttonProps = {
      htmlType: btnDef.type || (btnDef.action === 'submit' ? 'submit' : 'button'),
      onClick: specificOnClick ? specificOnClick : () => handleFooterAction(btnDef),
      disabled: btnDef.disabled || (btnDef.action === 'submit' && isSubmitting),
      title: btnDef.title || btnDef.text,
      className: '',
    };
    let children = btnDef.text ? [btnDef.text] : [];
    if (btnDef.action === 'submit' && isSubmitting) {
        children = [ICONS.loading || 'Submitting...', ...children];
    } else if (btnDef.buttonIcon && ICONS[btnDef.buttonIcon]) {
      const iconSvg = <span dangerouslySetInnerHTML={{ __html: ICONS[btnDef.buttonIcon] }} />;
      if (children.length > 0) children.unshift(iconSvg, ' ');
      else children = [iconSvg];
    }
    buttonProps.children = children;
    if (btnDef.class) {
      const classes = btnDef.class.split(' ');
      classes.forEach(cls => {
        if (cls.startsWith('button--')) {
          const styleOrSize = cls.substring('button--'.length);
          if (['primary', 'secondary', 'line-primary', 'line-secondary', 'ghost', 'info', 'icon', 'round', 'text'].includes(styleOrSize)) buttonProps.type = styleOrSize;
          else if (['small', 'xsmall', 'medium'].includes(styleOrSize)) buttonProps.size = styleOrSize;
          else buttonProps.className += ` ${cls}`;
        } else if (cls !== 'button') buttonProps.className += ` ${cls}`;
      });
    }
    if (children.length === 1 && !btnDef.text && btnDef.buttonIcon && !buttonProps.type && !(btnDef.action === 'submit' && isSubmitting)) buttonProps.type = 'icon';
    if (!buttonProps.type && btnDef.action !== 'submit' && !specificOnClick) buttonProps.type = 'secondary';
    buttonProps.className = buttonProps.className.trim();
    if (!buttonProps.className) delete buttonProps.className;
    return buttonProps;
  }, [handleFooterAction, ICONS, isSubmitting]);

  return (
    <dialog class="dialog" open style={dialogStyle} onClose={handleDialogNativeClose}>
      <div class="dialog__content">
        <div class="dialog__header">
          <h3 class="dialog__title">{template.title}</h3>
          <Button type="ghost" onClick={onCloseProp} ariaLabel="닫기" className="dialog__close-button">
            <span dangerouslySetInnerHTML={{ __html: ICONS.close }} />
          </Button>
        </div>
        <div class="dialog__body scroll--common">
          <form class={formClasses} id={`${dialogType}_Form`} noValidate style={formStyle} onSubmit={handleFormSubmit}>
            {template.fields && template.fields.map(field => {
              const uniqueFieldId = `${dialogType}_${field.id}`;
              const uniqueFieldName = `${dialogType}_${field.name || field.id}`;
              const fieldType = field.type || 'default';
              const valueFromState = formData[field.id];

              // For single checkbox, FormFieldWrapper's label is often omitted or used differently.
              // Checkbox itself has a label prop.
              const wrapperLabel = fieldType === 'checkbox' ? null : field.label;
              const isFieldVertical = field.layout === 'vertical' || ['table', 'image-upload', 'customHtml', 'checkbox', 'radio-group', 'checkbox-group'].includes(fieldType);


              if (field.readonly && field.format && fieldType !== 'table') {
                const displayValue = valueFromState !== undefined && valueFromState !== null ? String(valueFromState) : (field.placeholder || '');
                return (
                  <FormFieldWrapper
                    key={field.id} label={wrapperLabel} required={field.required}
                    isVertical={isFieldVertical} fieldId={field.id}
                    colSpan={field.colSpan} flexStyle={field.flexStyle}
                    dialogLayout={template.dialogLayout} disabled={field.disabled || field.readonly}
                  >
                    <span class="field__readonly-value" id={uniqueFieldId}>{displayValue}</span>
                  </FormFieldWrapper>
                );
              }

              let control = null;
              const commonProps = {
                id: uniqueFieldId,
                name: uniqueFieldName,
                placeholder: field.placeholder,
                disabled: field.disabled || field.readonly || isSubmitting,
                readOnly: field.readonly,
                required: field.required,
                "aria-describedby": `${uniqueFieldId}-error`,
              };

              if (fieldType === 'table') {
                control = (
                  <TableField
                    field={field}
                    rows={Array.isArray(valueFromState) ? valueFromState : []}
                    dialogType={dialogType}
                    onTableAction={handleTableAction}
                    mapButtonProps={mapButtonProps}
                    uniqueFieldId={uniqueFieldId}
                    disabled={commonProps.disabled}
                  />
                );
              } else if (fieldType === 'checkbox') {
                control = (
                  <Checkbox
                    {...commonProps}
                    label={field.label} // Checkbox takes its own label
                    checked={!!valueFromState}
                    onChange={(e) => handleInputChange(field.id, e.target.checked)}
                  />
                );
              } else if (fieldType === 'radio-group') {
                control = (
                  <RadioGroup
                    {...commonProps}
                    options={field.options}
                    selectedValue={valueFromState}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                );
              } else if (fieldType === 'checkbox-group') {
                control = (
                  <CheckboxGroup
                    {...commonProps}
                    options={field.options}
                    selectedValues={valueFromState || []}
                    onChange={(e, value, isChecked) => {
                      const currentValues = formData[field.id] || [];
                      const newValues = isChecked ? [...currentValues, value] : currentValues.filter(v => v !== value);
                      handleInputChange(field.id, newValues);
                    }}
                  />
                );
              } else if (fieldType === 'text' || fieldType === 'default' || fieldType === 'email' || fieldType === 'password' || fieldType === 'number' || fieldType === 'url' || fieldType === 'tel' || fieldType === 'date' || fieldType === 'datetime' || fieldType === 'month' || fieldType === 'year') {
                let inputType = field.inputType || 'text';
                if (['date', 'email', 'password', 'number', 'url', 'tel'].includes(fieldType)) inputType = fieldType;
                else if (fieldType === 'datetime') inputType = 'datetime-local';
                else if (fieldType === 'month') inputType = 'month';
                else if (fieldType === 'year') inputType = 'number';
                control = <Input {...commonProps} value={valueFromState || ''} type={inputType} onInput={(e) => handleInputChange(field.id, e.target.value)} />;
              } else if (fieldType === 'textarea') {
                control = <Textarea {...commonProps} value={valueFromState || ''} rows={field.rows} onInput={(e) => handleInputChange(field.id, e.target.value)} />;
              } else if (fieldType === 'select') {
                control = <Select {...commonProps} value={valueFromState || ''} options={field.options} onChange={(e) => handleInputChange(field.id, e.target.value)} />;
              } else {
                control = <p>Unsupported field type: {fieldType} for field ID: {field.id}</p>;
              }

              return (
                <FormFieldWrapper
                  key={field.id} label={wrapperLabel} labelFor={uniqueFieldId}
                  required={field.required} errorMessage={validationErrors[field.id]}
                  uniqueErrorSpanId={`${uniqueFieldId}-error`}
                  isVertical={isFieldVertical}
                  fieldId={field.id} colSpan={field.colSpan} flexStyle={field.flexStyle}
                  dialogLayout={template.dialogLayout} disabled={commonProps.disabled}
                >
                  {control}
                </FormFieldWrapper>
              );
            })}
          </form>
        </div>
        <div class="dialog__footer">
          {template.footerActions && template.footerActions.map((btnDef, index) => (
            <Button key={`${dialogType}-footer-${index}-${btnDef.action || 'action'}`} {...mapButtonProps(btnDef)} />
          ))}
        </div>
      </div>
    </dialog>
  );
};

export default DialogManagerComponent;
