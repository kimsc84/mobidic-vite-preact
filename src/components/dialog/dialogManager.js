/* // d:\99.dev\common-modal\js\dialogManager.js
/**
 * dialogManager.js
 * @module dialogManager
 * 공통 다이얼로그(모달) 생성 및 관리 클래스
 */

const html = (strings, ...values) => String.raw({ raw: strings }, ...values);

import dialogTemplates from "./dialogTemplates.js"; // 동일 디렉토리
import { ICONS } from "./iconUtils.js"; // 동일 디렉토리

class DialogManager {
  constructor() {
    this.dialogs = {};
    this.templates = dialogTemplates;

    this._controlGenerators = {
      text: this._generateInputHtml,
      textarea: this._generateTextareaHtml,
      select: this._generateSelectHtml,
      checkbox: this._generateSingleCheckboxHtml,
      date: this._generateDateHtml,
      table: this._generateTableContainerHtml,
      "radio-group": this._generateRadioCheckboxGroupHtml,
      "checkbox-group": this._generateRadioCheckboxGroupHtml,
      "input-group": this._generateInputGroupHtml,
      "date-range": this._generateDateRangeHtml,
      "image-upload": this._generateImageUploadHtml,
      default: this._generateInputHtml,
      customHtml: this._generateCustomHtml, // <<< [추가] customHtml 생성기
    };

    this._fieldInitializers = {
      text: this._setInputFieldValue,
      textarea: this._setInputFieldValue,
      select: this._setSelectValue,
      checkbox: this._setSingleCheckboxValue,
      date: this._setInputFieldValue,
      table: this._populateTable,
      "radio-group": this._setRadioGroupValue,
      "checkbox-group": this._setCheckboxGroupValue,
      "input-group": this._setInputGroupValue,
      "date-range": this._setDateRangeValue,
      "image-upload": this._setImageUploadValue,
      default: this._setInputFieldValue,
      customHtml: this._initializeCustomHtml, // <<< [추가] customHtml 초기화 (no-op 가능)
    };

    this._fieldCollectors = {
      text: this._getInputFieldValue,
      textarea: this._getInputFieldValue,
      select: this._getSelectValue,
      checkbox: this._getSingleCheckboxValue,
      date: this._getInputFieldValue,
      table: this._collectTableData,
      "radio-group": this._getRadioGroupValue,
      "checkbox-group": this._getCheckboxGroupValue,
      "input-group": this._getInputGroupValue,
      "date-range": this._getDateRangeValue,
      "image-upload": this._getImageUploadValue,
      default: this._getInputFieldValue,
      customHtml: this._collectCustomHtmlData, // <<< [추가] customHtml 수집 (no-op 가능)
    };

    this.submitCallback = null;
    this.tableActionCallback = null;
  }

  setTableActionCallback(callback) {
    if (typeof callback === "function") {
      this.tableActionCallback = callback;
    } else {
      console.error("[DialogManager] 테이블 액션 콜백은 함수여야 합니다.");
    }
  }

  open(type, options = {}) {
    const { dialogWidth, dialogHeight, ...initialFieldData } = options;

    let dialog = this.dialogs[type];
    if (dialog) {
      console.info(`[DialogManager] open: 기존 다이얼로그 재사용 (type: ${type}, id: ${dialog.id})`);
    } else {
      console.info(`[DialogManager] open: 새 다이얼로그 생성 시도 (type: ${type})`);
      dialog = this._createDialog(type);
    }

    if (!dialog) {
      // _createDialog에서 null 반환 시 여기서 걸림
      console.error(`[DialogManager] open: 다이얼로그 인스턴스 확보 실패 (type: ${type})`);
      return;
    }

    const form = dialog.querySelector("form.form");
    if (form) {
      form.reset();
      this._clearValidationErrors(form);
    }
    // 날짜 입력 필드에 이벤트 리스너 추가 (값이 바뀔 때 has-value 클래스 업데이트)
    dialog.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="month"]').forEach(dateInput => {
      dateInput.addEventListener('input', (e) => this._updateDateInputState(e.target));
      dateInput.addEventListener('change', (e) => this._updateDateInputState(e.target)); // 혹시 모를 브라우저 호환성
      // 초기 로드 시에도 상태 업데이트
      this._updateDateInputState(dateInput);
    });

    // _createDialog 내부에서 template을 이미 확인하므로, 여기서 중복 확인은 불필요할 수 있음.
    // 다만, dialog가 null이 아닌데 template이 없는 경우는 없어야 함.
    const template = this.templates[type];
    if (!template) {
      console.error(`[DialogManager] open: "${type}" 타입의 템플릿을 찾을 수 없습니다. (dialog 객체는 존재하나 template 누락)`);
      return;
    }
    this._initializeFormValues(dialog, template, initialFieldData, type);

    // 스타일 설정을 showModal() 호출 앞으로 이동
    if (dialogWidth) {
      dialog.style.width = dialogWidth;
    } else if (template.dialogWidth) {
      dialog.style.width = template.dialogWidth;
    } else {
      dialog.style.width = ""; // 명시적 너비가 없으면 기본값으로 (CSS에 따름)
    }
    if (dialogHeight) {
      dialog.style.height = dialogHeight;
    } else if (template.dialogHeight) {
      dialog.style.height = template.dialogHeight;
    } else {
      dialog.style.height = ""; // 명시적 높이가 없으면 기본값으로
    }


    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch (error) {
        console.error(`[DialogManager] 다이얼로그 "${type}" 열기 실패:`, error);
      }
    }

  }

  /**
   * 지정된 컨테이너 요소 내부에 폼 필드를 렌더링합니다.
   * 모달 관련 UI(헤더, 푸터, showModal 등)는 생성하지 않습니다.
   * @param {HTMLElement} containerElement - 폼 필드를 렌더링할 부모 HTML 요소.
   * @param {object} templateObject - 폼 필드 구성을 정의하는 템플릿 객체 (dialogTemplates의 값과 유사한 구조).
   * @param {object} [initialData={}] - 폼 필드의 초기 데이터 객체.
   * @returns {object | null} 생성된 폼을 제어하기 위한 메소드가 담긴 객체 (getFormData, validate, reset, getFormElement) 또는 실패 시 null.
   */
  renderFormInContainer(containerElement, templateObject, initialData = {}) {
    if (!containerElement || !templateObject || !templateObject.fields) {
      console.error("[DialogManager] renderFormInContainer: 필수 인자(컨테이너, 템플릿 객체, 필드 정의)가 누락되었습니다.");
      return null;
    }

    const fixedDialogType = 'formInContainer'; // 내부 ID 생성 등을 위한 고정 타입
    const formId = this._getUniqueElementId(fixedDialogType, "FormInContainer");

    // 기존 _createDialog와 유사하게 레이블 최소 너비 계산
    const longestLabelInfo = this._findLongestLabelFromTemplate(templateObject); // 템플릿 객체 직접 사용
    const calculatedMinWidthEm = Math.max(6, longestLabelInfo.length * 0.7 + 2);
    const labelMinWidthStyle = `--form-label-min-width: ${calculatedMinWidthEm.toFixed(2)}em;`;

    let formClasses = "form";
    let formStyles = labelMinWidthStyle;

    if (templateObject.dialogLayout === "2-column-grid") {
      formClasses += " form--layout-2-column-grid";
    } else if (templateObject.dialogLayout === "mixed-flex") {
      formClasses += " form--layout-mixed-flex";
      formStyles += " display: flex; flex-direction: row;flex-wrap: wrap;";
    }

    const formElement = document.createElement("form");
    formElement.className = formClasses;
    formElement.id = formId;
    formElement.noValidate = true;
    formElement.style.cssText = formStyles; // 여러 스타일 적용 위해 cssText 사용

    formElement.innerHTML = this._generateFieldsHtml(templateObject.fields, fixedDialogType, templateObject.dialogLayout);
    containerElement.innerHTML = ''; // 컨테이너 비우기
    containerElement.appendChild(formElement);

    this._initializeFormValues(formElement, templateObject, initialData, fixedDialogType);

    // 날짜 입력 필드 이벤트 리스너 추가
    formElement.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="month"]').forEach(dateInput => {
      dateInput.addEventListener('input', (e) => this._updateDateInputState(e.target));
      dateInput.addEventListener('change', (e) => this._updateDateInputState(e.target));
      this._updateDateInputState(dateInput);
    });

    return {
      getFormData: () => this._collectFormData(formElement, fixedDialogType),
      validate: () => this._validateForm(formElement, fixedDialogType),
      reset: () => {
        formElement.reset();
        this._clearValidationErrors(formElement);
        this._initializeFormValues(formElement, templateObject, initialData, fixedDialogType);
        formElement.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="month"]').forEach(dateInput => {
          this._updateDateInputState(dateInput);
        });
      },
      getFormElement: () => formElement,
    };
  }

  setSubmitCallback(callback) {
    if (typeof callback === "function") {
      this.submitCallback = callback;
    } else {
      console.error("[DialogManager] 폼 제출 콜백은 함수여야 합니다.");
    }
  }

  addTableRow(uniqueTableId, rowData) {
    // tableId를 uniqueTableId로 변경
    const tableElement = document.getElementById(uniqueTableId);
    if (!tableElement) {
      console.error(`[DialogManager] 테이블 행 추가: 테이블 요소를 찾을 수 없습니다. (ID: ${uniqueTableId})`);
      return false;
    }
    const tableBody = tableElement.querySelector("tbody.table__body");
    const dialogElement = tableElement.closest("dialog");
    const dialogType = dialogElement?.dataset.dialogType;
    // dialog._fieldDefinitions는 uniqueId를 키로 사용하도록 수정 필요 또는 다른 방식으로 fieldDefinition 가져오기
    // 여기서는 dialogType과 originalTableId로 fieldDefinition을 찾는다고 가정
    const originalTableId = uniqueTableId.substring(dialogType.length + 1);
    const fieldDefinition = this.templates[dialogType]?.fields.find((f) => f.id === originalTableId && f.type === "table");

    if (!tableBody || !fieldDefinition || !fieldDefinition.columns || !dialogType) {
      console.error(
        `[DialogManager] 테이블 행 추가: 테이블 본문(tbody), 컬럼 정의 또는 dialogType을 찾을 수 없습니다. (ID: ${uniqueTableId})`,
      );
      return false;
    }

    const noDataRow = tableBody.querySelector(".table__row--no-data");
    if (noDataRow) noDataRow.remove();

    const isEditable = fieldDefinition.editable === true;
    const rowHtml = this._renderTableRow(rowData, fieldDefinition.columns, isEditable, dialogType, originalTableId);

    if (rowHtml) {
      tableBody.insertAdjacentHTML("beforeend", rowHtml);
      return true;
    }
    return false;
  }

  removeTableRow(uniqueTableId, rowId) {
    // tableId를 uniqueTableId로 변경
    const tableElement = document.getElementById(uniqueTableId);
    if (!tableElement) {
      console.error(`[DialogManager] 테이블 행 삭제: 테이블 요소를 찾을 수 없습니다. (ID: ${uniqueTableId})`);
      return false;
    }
    const rowElement = tableElement.querySelector(`tbody.table__body tr[data-row-id="${rowId}"]`);

    if (rowElement) {
      const tableBody = rowElement.parentNode;
      rowElement.remove();
      if (tableBody && tableBody.children.length === 0) {
        this._addNoDataRow(tableBody);
      }
      return true;
    } else {
      console.warn(`[DialogManager] 테이블 행 삭제: 테이블(ID: ${uniqueTableId})에서 행(ID: ${rowId})을 찾을 수 없습니다.`);
      return false;
    }
  }

  removeAllTableRows(uniqueTableId) {
    // tableId를 uniqueTableId로 변경
    const tableElement = document.getElementById(uniqueTableId);
    if (!tableElement) {
      console.error(`[DialogManager] 테이블 모든 행 삭제: 테이블 요소를 찾을 수 없습니다. (ID: ${uniqueTableId})`);
      return false;
    }
    const tableBody = tableElement.querySelector("tbody.table__body");

    if (tableBody) {
      tableBody.innerHTML = "";
      this._addNoDataRow(tableBody);
      return true;
    } else {
      console.error(`[DialogManager] 테이블 모든 행 삭제: 테이블 본문(tbody)을 찾을 수 없습니다. (ID: ${uniqueTableId})`);
      return false;
    }
  }

  _getUniqueElementId(dialogType, baseId, suffix = "") {
    if (!dialogType || !baseId) {
      // console.warn(`[DialogManager] _getUniqueElementId: dialogType 또는 baseId가 제공되지 않았습니다. dialogType: ${dialogType}, baseId: ${baseId}`);
      // return `${baseId}${suffix}`; // fallback 또는 오류 처리
    }
    return `${dialogType}_${baseId}${suffix}`;
  }

  _getUniqueElementName(dialogType, field, suffix = "") {
    const baseName = field.name || field.id;
    if (!dialogType || !baseName) {
      // console.warn(`[DialogManager] _getUniqueElementName: dialogType 또는 baseName이 제공되지 않았습니다. dialogType: ${dialogType}, baseName: ${baseName}`);
      // return `${baseName}${suffix}`; // fallback 또는 오류 처리
    }
    return `${dialogType}_${baseName}${suffix}`;
  }

  _createDialog(type) {
    const formId = this._getUniqueElementId(type, "Form"); // form ID도 고유하게
    const template = this.templates[type];
    if (!template) {
      console.error(`[DialogManager] 다이얼로그 생성: "${type}" 타입의 템플릿을 찾을 수 없습니다.`);
      return null;
    }

    const dialog = document.createElement("dialog");
    dialog.id = this._getUniqueElementId(type, "Dialog"); // dialog ID도 고유하게
    dialog.classList.add("dialog");
    dialog.dataset.dialogType = type;
    console.info(`[DialogManager] _createDialog: 새 다이얼로그 요소 생성 (type: ${type}, id: ${dialog.id})`);

    const longestLabelInfo = this._findLongestLabelFromTemplate(template); // 템플릿 객체 직접 사용
    const calculatedMinWidthEm = Math.max(6, longestLabelInfo.length * 0.7 + 2);
    const labelMinWidthStyle = `--form-label-min-width: ${calculatedMinWidthEm.toFixed(2)}em;`;

    let formClasses = "form";
    let formStyles = labelMinWidthStyle;

    if (template.dialogLayout === "2-column-grid") {
      formClasses += " form--layout-2-column-grid";
    } else if (template.dialogLayout === "mixed-flex") {
      formClasses += " form--layout-mixed-flex";
      formStyles += " display: flex; flex-wrap: wrap;";
    }

    dialog.innerHTML = html`
      <div class="dialog__content" style="display: flex; flex-direction: column; width: 100%; height: 100%;">
        <div class="dialog__header">
          <h3 class="dialog__title">${this._escapeHtml(template.title)}</h3>
          <button class="button button--ghost button--icon dialog__close-button" type="button" title="닫기" data-action="close">
            ${this._getIconSvg("close")}
          </button>
        </div>
        <div class="dialog__body scroll--common">
          <form class="${formClasses}" id="${formId}" novalidate style="${formStyles}">
            ${this._generateFieldsHtml(template.fields, type, template.dialogLayout)}
          </form>
        </div>
        <div class="dialog__footer">${this._generateButtonsHtml(template.footerActions)}</div>
      </div>
    `;

    // dialog._fieldDefinitions는 더 이상 사용하지 않거나, uniqueId를 키로 사용하도록 수정
    // 여기서는 제거하고, 필요시 _populateTable 등에서 직접 template.fields를 참조하도록 함

    this._setupEventHandlers(dialog);

    if (formId) {
      const footer = dialog.querySelector(".dialog__footer");
      if (footer) {
        footer.querySelectorAll('button[type="submit"]').forEach((button) => button.setAttribute("form", formId));
      }
    }

    document.body.appendChild(dialog);
    this.dialogs[type] = dialog;

    return dialog;
  }

  _setupEventHandlers(dialog) {
    const form = dialog.querySelector("form.form");
    const dialogType = dialog.dataset.dialogType;

    dialog.addEventListener("click", (e) => {
      const actionElement = e.target.closest("[data-action]");
      if (!actionElement) return;

      const action = actionElement.dataset.action;
      const originalTableId = actionElement.dataset.tableId; // 원본 테이블 ID
      const rowId = actionElement.dataset.rowId;
      const closestRow = e.target.closest("tr[data-row-id]");

      let uniqueTableId = null;
      if (originalTableId) {
        uniqueTableId = this._getUniqueElementId(dialogType, originalTableId);
      } else if (closestRow) {
        uniqueTableId = closestRow.closest("table")?.id; // 이미 uniqueId
      }

      switch (action) {
        case "cancel":
        case "close":
          dialog.close();
          return;
        case "add-file": // 테이블 헤더의 파일 추가 버튼
          break;
        default:
          break;
      }

      if (action === "add-file" && uniqueTableId) {
        e.preventDefault();
        this._handleAddFileClick(dialog, uniqueTableId);
      }
      if (action === "select-image" || action === "remove-image") {
        e.preventDefault();
        const originalTargetInputId = actionElement.dataset.targetInput;
        const uniqueTargetInputId = this._getUniqueElementId(dialogType, originalTargetInputId);
        const fileInput = dialog.querySelector(`#${uniqueTargetInputId}`);
        if (fileInput) {
          if (action === "select-image") {
            fileInput.click();
          } else if (action === "remove-image") {
            this._clearImagePreview(fileInput, dialog); // dialog 인스턴스 전달
          }
        }
      }

      if (
        !["select-image", "remove-image"].includes(action) &&
        ((closestRow && rowId) || uniqueTableId) &&
        typeof this.tableActionCallback === "function"
      ) {
        e.preventDefault();
        const details = {
          rowId,
          tableId: uniqueTableId, // uniqueTableId 사용
          dialogType,
          event: e,
        };
        Promise.resolve(this.tableActionCallback(action, details)).catch((error) => {
          console.error(`[DialogManager] 테이블 액션 콜백 (${action}) 실행 중 오류:`, error);
        });
        return;
      }
    });

    dialog.addEventListener("change", (e) => {
      if (e.target.classList.contains("file-input-hidden")) {
        e.preventDefault();
        const uniqueTableId = e.target.dataset.targetTableId; // data-target-table-id는 uniqueId를 가리킴

        if (uniqueTableId && typeof this.tableActionCallback === "function") {
          const details = {
            rowId: null,
            tableId: uniqueTableId,
            dialogType,
            event: e,
            files: e.target.files,
          };
          Promise.resolve(this.tableActionCallback("file-input-change", details)).catch((error) => {
            console.error(`[DialogManager] 테이블 액션 콜백 (file-input-change) 실행 중 오류:`, error);
            alert(`파일 처리 중 오류 발생: ${error.message || "알 수 없는 오류"}`);
          });
        }
        return;
      }

      if (e.target.classList.contains("image-upload-field__input")) {
        e.preventDefault();
        this._handleImageFileChange(e.target, dialog, dialogType); // dialogType 전달
        return;
      }
    });

    dialog.addEventListener("dragover", (e) => {
      const previewContainer = e.target.closest(".image-upload-field__preview-container");
      if (previewContainer) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        previewContainer.classList.add("image-upload-field__preview-container--dragover");
      }
    });

    dialog.addEventListener("dragleave", (e) => {
      const previewContainer = e.target.closest(".image-upload-field__preview-container");
      if (previewContainer) {
        e.preventDefault();
        e.stopPropagation();
        if (
          !previewContainer.contains(e.relatedTarget) ||
          (e.target === previewContainer && !previewContainer.contains(e.relatedTarget))
        ) {
          previewContainer.classList.remove("image-upload-field__preview-container--dragover");
        }
      }
    });

    dialog.addEventListener("drop", (e) => {
      const previewContainer = e.target.closest(".image-upload-field__preview-container");
      if (previewContainer) {
        e.preventDefault();
        e.stopPropagation();
        previewContainer.classList.remove("image-upload-field__preview-container--dragover");

        const files = e.dataTransfer.files;
        const originalTargetInputId = previewContainer.dataset.targetInput;
        const uniqueTargetInputId = this._getUniqueElementId(dialogType, originalTargetInputId);
        const fileInput = dialog.querySelector(`#${uniqueTargetInputId}`);

        if (files && files.length > 0 && fileInput) {
          fileInput.files = files;
          this._handleImageFileChange(fileInput, dialog, dialogType); // dialogType 전달
        }
      }
    });

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        // dialogType은 이미 위에서 가져옴
        let isFormValid = false;
        try {
          this._clearValidationErrors(form);
          isFormValid = this._validateForm(form);
        } catch (validationError) {
          console.error(`[DialogManager] 다이얼로그 "${dialogType}" 유효성 검사 중 오류 발생:`, validationError);
          isFormValid = false;
        }

        if (!isFormValid) {
          const firstInvalid = form.querySelector(
            ".field--invalid .input, .field--invalid .textarea, .field--invalid .select, .field--invalid .control-group__input, .field--invalid .checkbox__input",
          );
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        const formDataObject = this._collectFormData(form, dialogType);

        if (typeof this.submitCallback === "function") {
          try {
            await this.submitCallback(dialogType, formDataObject);
            dialog.close("submit");
          } catch (error) {
            console.error(`[DialogManager] 다이얼로그 "${dialogType}" 폼 데이터 처리 중 오류 발생:`, error);
            alert(`오류: ${error.message || "데이터 처리 중 문제가 발생했습니다."}`);
          }
        } else {
          console.warn(
            `[DialogManager] 다이얼로그 "${dialogType}" 폼 제출: submit 콜백 함수가 정의되지 않았습니다. 데이터만 콘솔에 기록됩니다.`,
          );
          console.log("제출된 데이터:", formDataObject);
          alert("submit 콜백 없음. 콘솔 확인.");
        }
      });
    }
  }

  _generateFieldsHtml(fields, dialogType, dialogLayout) {
    return (fields || [])
      .map((field) => {
        const originalFieldId = field.id;
        const fieldType = field.type || "default";

        const isCustomContainerField = ["table", "image-upload"].includes(fieldType);

        const isGroup = ["radio-group", "checkbox-group", "input-group", "date-range"].includes(fieldType); // textarea 제외
        const isSingleCheckbox = fieldType === "checkbox";
        const hasLabel = field.label && typeof field.label === "string";
        const isExplicitlyVertical = field.layout === "vertical";

        const uniqueFieldId = this._getUniqueElementId(dialogType, originalFieldId);
        const uniqueFieldName = this._getUniqueElementName(dialogType, field);

        let labelHtml = "";
        if (!isCustomContainerField && hasLabel && !isSingleCheckbox) {
          const requiredMark = field.required ? `<span class="field__required-mark">*</span>` : "";
          const labelClasses = ["field__label"];
          if (isGroup) labelClasses.push("field__label--group");
          const forAttr = !isGroup ? `for="${uniqueFieldId}"` : "";
          labelHtml = `<label class="${labelClasses.join(" ")}" ${forAttr}>${this._escapeHtml(
            field.label,
          )}${requiredMark}</label>`;
        }

        const fieldContainerClasses = ["field"];
        if (isCustomContainerField || isExplicitlyVertical) {
          // textarea도 기본 세로
          fieldContainerClasses.push("field--vertical");
        }
        if (fieldType === "image-upload") {
          fieldContainerClasses.push("image-upload-field-container");
        }
        if (field.disabled || field.readonly) fieldContainerClasses.push("field--disabled");

        const generator = this._controlGenerators[fieldType] || this._controlGenerators["default"];
        const controlOrCustomStructureHtml = generator
          ? generator.call(this, field, dialogType, uniqueFieldId, uniqueFieldName)
          : "";

        let fieldWrapperStyles = "";
        if (dialogLayout === "2-column-grid" && field.colSpan) {
          fieldWrapperStyles = `grid-column: span ${field.colSpan};`;
        } else if (dialogLayout === "mixed-flex" && field.flexStyle && typeof field.flexStyle === "object") {
          fieldWrapperStyles = Object.entries(field.flexStyle)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}:${value}`)
            .join(";");
        }

        const uniqueErrorSpanId = `${uniqueFieldId}-error`;

        if (isCustomContainerField) {
          return `
            <div class="${fieldContainerClasses.join(" ")}" data-field-id="${originalFieldId}" style="${fieldWrapperStyles}">
              ${labelHtml}
              ${controlOrCustomStructureHtml}
            </div>`;
        } else {
          return `
            <div class="${fieldContainerClasses.join(" ")}" data-field-id="${originalFieldId}" style="${fieldWrapperStyles}">
              ${labelHtml}
              <div class="field__control-wrapper">
                ${controlOrCustomStructureHtml}
                <span class="field__error-message" id="${uniqueErrorSpanId}" role="alert" aria-live="polite"></span>
              </div>
            </div>`;
        }
      })
      .join("");
  }

  _generateInputHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    if ((field.readonly || field.disabled) && field.format) {
      const displayValue = this._formatValue(field.value, field.format);
      return `<span class="field__readonly-value" id="${uniqueFieldId}" aria-describedby="${uniqueFieldId}-error">${this._escapeHtml(
        displayValue,
      )}</span>`;
    }
    const inputType = field.inputType || (field.type === "default" ? "text" : field.type);
    let attributes = this._generateHtmlAttributes(field, ["value", "id", "name", "type", "placeholder", "aria-describedby"]);
    const valueAttr = field.value !== undefined && field.value !== null ? `value="${this._escapeHtml(field.value)}"` : "";
    // if (field.disabled || field.readonly) attributes += ' disabled'; // _generateHtmlAttributes에서 처리
    const placeholderAttr = field.placeholder ? `placeholder="${this._escapeHtml(field.placeholder)}"` : "";
    return `<input class="input" type="${inputType}" id="${uniqueFieldId}" name="${uniqueFieldName}" ${attributes} ${valueAttr} ${placeholderAttr} aria-describedby="${uniqueFieldId}-error">`;
  }

  _generateDateHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    if ((field.readonly || field.disabled) && field.format) {
      const displayValue = this._formatValue(field.value, field.format);
      return `<span class="field__readonly-value">${this._escapeHtml(displayValue)}</span>`;
    }
    const granularity = field.granularity || "date";
    let inputType = "date";
    let defaultPlaceholder = "YYYY-MM-DD";
    let defaultAttrs = {};
    switch (granularity) {
      case "datetime":
        inputType = "datetime-local";
        defaultPlaceholder = "YYYY-MM-DD HH:MM";
        break;
      case "month":
        inputType = "month";
        defaultPlaceholder = "YYYY-MM";
        break;
      case "year":
        inputType = "number";
        defaultPlaceholder = "YYYY";
        defaultAttrs = { min: "1900", max: "2100", step: "1" };
        break;
    }
    const mergedAttrs = { ...defaultAttrs, ...field };
    let attributes = this._generateHtmlAttributes(mergedAttrs, [
      "value",
      "placeholder",
      "granularity",
      "inputType",
      "id",
      "name",
      "type",
      "aria-describedby",
    ]);

    const placeholderValue = this._escapeHtml(field.placeholder || defaultPlaceholder);
    // ✨ 네이티브 placeholder 속성은 date, datetime-local, month 타입에서는 제거 (CSS로 커스텀 플레이스홀더 제어)
    const nativePlaceholderAttr = ["date", "datetime-local", "month"].includes(inputType) ? "" : `placeholder="${placeholderValue}"`;
    const valueAttr = field.value !== undefined && field.value !== null ? `value="${this._escapeHtml(field.value)}"` : "";
    const hasValueClass = field.value ? "has-value" : "";

    // ::before 스타일링을 위해 data-placeholder 속성 추가
    const dataPlaceholderAttr = `data-placeholder="${placeholderValue}"`;

    return `<input class="input ${hasValueClass}" type="${inputType}" id="${uniqueFieldId}" name="${uniqueFieldName}" ${attributes} ${nativePlaceholderAttr} ${valueAttr} ${dataPlaceholderAttr} aria-describedby="${uniqueFieldId}-error">`;
  }

  _generateTextareaHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    if ((field.readonly || field.disabled) && field.format) {
      const displayValue = this._formatValue(field.value, field.format);
      return `<pre class="field__readonly-value field__readonly-value--textarea">${this._escapeHtml(displayValue)}</pre>`;
    }
    let attributes = this._generateHtmlAttributes(field, ["value", "id", "name", "placeholder", "rows", "aria-describedby"]);
    // if (field.disabled || field.readonly) attributes += ' disabled'; // _generateHtmlAttributes에서 처리
    const placeholderAttr = field.placeholder ? `placeholder="${this._escapeHtml(field.placeholder)}"` : "";
    const rowsAttr = field.rows ? `rows="${field.rows}"` : "";
    return `<textarea class="textarea" id="${uniqueFieldId}" name="${uniqueFieldName}" ${attributes} ${placeholderAttr} ${rowsAttr} aria-describedby="${uniqueFieldId}-error">${this._escapeHtml(
      field.value || "",
    )}</textarea>`;
  }

  _generateSelectHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    let attributes = this._generateHtmlAttributes(field, ["value", "options", "id", "name", "aria-describedby"]);
    // if (field.disabled || field.readonly) attributes += ' disabled'; // _generateHtmlAttributes에서 처리
    const optionsHtml = (field.options || [])
      .map((opt) => {
        const isSelected = field.value !== undefined && String(opt.value) === String(field.value);
        const optionAttrs = this._generateHtmlAttributes({ value: opt.value, disabled: opt.disabled, selected: isSelected }, [
          "label",
          "text",
          "id",
          "name",
        ]);
        return `<option ${optionAttrs}>${this._escapeHtml(opt.text)}</option>`;
      })
      .join("");
    return `<select class="select" id="${uniqueFieldId}" name="${uniqueFieldName}" ${attributes} aria-describedby="${uniqueFieldId}-error">${optionsHtml}</select>`;
  }

  _generateRadioCheckboxGroupHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    const groupType = field.type === "radio-group" ? "radio" : "checkbox";
    const containerClass = "control-group";
    const modifierClass = `control-group--${groupType === "radio" ? "radio" : "checkbox"}`;
    const groupAttrs = field.required
      ? `data-required-group="true" aria-describedby="${uniqueFieldId}-error"`
      : `aria-describedby="${uniqueFieldId}-error"`;
    const groupDisabled = field.disabled || field.readonly;

    const itemsHtml = (field.options || [])
      .map((opt, index) => {
        const optionUniqueId = `${uniqueFieldId}_${index}`; // 옵션 ID도 고유하게
        const isChecked =
          groupType === "radio"
            ? field.value !== undefined && String(opt.value) === String(field.value)
            : Array.isArray(field.value) && field.value.map(String).includes(String(opt.value));
        const isDisabled = groupDisabled || opt.disabled;
        const inputAttrs = this._generateHtmlAttributes(
          { value: opt.value, checked: isChecked, disabled: isDisabled, required: field.required && groupType === "radio" },
          ["label", "text", "id", "name", "type"],
        );
        const itemClasses = ["control-group__item"];
        if (isDisabled) itemClasses.push("control-group__item--disabled");
        return `
          <label class="${itemClasses.join(" ")}" for="${optionUniqueId}">
            <input class="control-group__input" type="${groupType}" name="${uniqueFieldName}" id="${optionUniqueId}" ${inputAttrs}>
            <span class="control-group__label-text">${this._escapeHtml(opt.label)}</span>
          </label>`;
      })
      .join("");
    return `<div class="${containerClass} ${modifierClass}" id="${uniqueFieldId}" ${groupAttrs}>${itemsHtml}</div>`;
  }

  _generateSingleCheckboxHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    const isChecked = field.checked === true || (field.value !== undefined && field.value === true);
    const isDisabled = field.disabled || field.readonly;
    const inputAttrs = this._generateHtmlAttributes({ ...field, checked: isChecked, disabled: isDisabled }, [
      "label",
      "id",
      "name",
      "type",
      "aria-describedby",
    ]);
    const requiredMark = field.required ? '<span class="field__required-mark">*</span>' : "";
    const labelClasses = ["checkbox"];
    if (isDisabled) labelClasses.push("checkbox--disabled");
    return `
        <label class="${labelClasses.join(" ")}" for="${uniqueFieldId}">
          <input class="checkbox__input" type="checkbox" id="${uniqueFieldId}" name="${uniqueFieldName}" ${inputAttrs} aria-describedby="${uniqueFieldId}-error">
          <span class="checkbox__label-text">${this._escapeHtml(field.label)}</span>
          ${requiredMark}
        </label>`;
  }

  _generateInputGroupHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    const containerClass = "control-group control-group--input";
    const groupAttrs = field.required
      ? `data-required-group="true" aria-describedby="${uniqueFieldId}-error"`
      : `aria-describedby="${uniqueFieldId}-error"`;
    const groupDisabled = field.disabled || field.readonly;
    let itemsHtml = "";

    if (Array.isArray(field.items)) {
      field.items.forEach((item) => {
        const itemType = item.type || "input";
        const isDisabled = groupDisabled || item.disabled || item.readonly;
        const isRequired = item.required !== undefined ? item.required : field.required;
        const itemOriginalId = item.id;
        const uniqueItemId = this._getUniqueElementId(dialogType, `${field.id}_${itemOriginalId}`);
        const uniqueItemName = this._getUniqueElementName(dialogType, { id: `${field.id}_${itemOriginalId}`, name: item.name });

        switch (itemType) {
          case "input":
            const inputOtherAttrs = this._generateHtmlAttributes({ ...item, disabled: isDisabled, required: isRequired }, [
              "value",
              "separator",
              "type",
              "inputType",
              "options",
              "text",
              "id",
              "name",
              "placeholder",
              "style",
              "aria-describedby",
            ]);
            const valueAttr = item.value !== undefined && item.value !== null ? `value="${this._escapeHtml(item.value)}"` : "";
            const placeholderAttr = item.placeholder ? `placeholder="${this._escapeHtml(item.placeholder)}"` : "";
            const styleAttr = item.style ? `style="${this._escapeHtml(item.style)}"` : "";
            itemsHtml += `<input class="input" type="${
              item.inputType || "text"
            }" id="${uniqueItemId}" name="${uniqueItemName}" ${inputOtherAttrs} ${valueAttr} ${placeholderAttr} ${styleAttr} aria-describedby="${uniqueFieldId}-error">`;
            break;
          case "select":
            const selectOtherAttrs = this._generateHtmlAttributes({ ...item, disabled: isDisabled, required: isRequired }, [
              "value",
              "separator",
              "type",
              "inputType",
              "options",
              "text",
              "id",
              "name",
              "style",
              "aria-describedby",
            ]);
            const optionsHtml = (item.options || [])
              .map((opt) => {
                const isSelected = item.value !== undefined && String(opt.value) === String(item.value);
                const optionAttrs = this._generateHtmlAttributes(
                  { value: opt.value, disabled: opt.disabled, selected: isSelected },
                  ["label", "text", "id", "name"],
                );
                return `<option ${optionAttrs}>${this._escapeHtml(opt.text)}</option>`;
              })
              .join("");
            const selectStyleAttr = item.style ? `style="${this._escapeHtml(item.style)}"` : "";
            itemsHtml += `<select class="select" id="${uniqueItemId}" name="${uniqueItemName}" ${selectOtherAttrs} ${selectStyleAttr} aria-describedby="${uniqueFieldId}-error">${optionsHtml}</select>`;
            break;
          case "separator":
            itemsHtml += `<span class="control-group__separator">${this._escapeHtml(item.text || "")}</span>`;
            break;
        }
      });
    }
    return `<div class="${containerClass}" id="${uniqueFieldId}" ${groupAttrs}>${itemsHtml}</div>`;
  }

  _generateDateRangeHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    const startUniqueId = `${uniqueFieldId}_start`;
    const endUniqueId = `${uniqueFieldId}_end`;
    const startUniqueName = `${uniqueFieldName}_start`;
    const endUniqueName = `${uniqueFieldName}_end`;
    const granularity = field.granularity || "date";
    let inputType = "date";
    let inputAttributes = { placeholder: "YYYY-MM-DD" };
    switch (granularity) {
      case "datetime":
        inputType = "datetime-local";
        inputAttributes = { placeholder: "YYYY-MM-DD HH:MM" };
        break;
      case "month":
        inputType = "month";
        inputAttributes = { placeholder: "YYYY-MM" };
        break;
      case "year":
        inputType = "number";
        inputAttributes = { min: "1900", max: "2100", step: "1", placeholder: "YYYY" };
        break;
    }
    const commonInputAttrs = {
      required: field.required,
      readonly: field.readonly,
      disabled: field.disabled,
      ...inputAttributes,
    };
    const startInputOtherAttrs = this._generateHtmlAttributes({ ...commonInputAttrs }, [
      "value",
      "id",
      "name",
      "type",
      "placeholder",
      "aria-describedby",
    ]);
    const endInputOtherAttrs = this._generateHtmlAttributes({ ...commonInputAttrs }, [
      "value",
      "id",
      "name",
      "type",
      "placeholder",
      "aria-describedby",
    ]);
    const startValueAttr = field.value?.start !== undefined ? `value="${this._escapeHtml(field.value.start)}"` : "";
    const startHasValueClass = field.value?.start ? "has-value" : "";
    const endValueAttr = field.value?.end !== undefined ? `value="${this._escapeHtml(field.value.end)}"` : "";
    const endHasValueClass = field.value?.end ? "has-value" : "";
    // ✨ 네이티브 placeholder 속성은 date, datetime-local, month 타입에서는 제거
    const shouldRemoveNativePlaceholderAttr = ["date", "datetime-local", "month"].includes(inputType);
    const placeholderValue = this._escapeHtml(inputAttributes.placeholder);

    return `
        <div class="control-group control-group--date-range" id="${uniqueFieldId}" aria-describedby="${uniqueFieldId}-error">
           <input class="input ${startHasValueClass}" type="${inputType}" id="${startUniqueId}" name="${startUniqueName}" ${startInputOtherAttrs} ${
      shouldRemoveNativePlaceholderAttr ? "" : `placeholder="${placeholderValue}"`
    } ${startValueAttr} data-placeholder="${placeholderValue}">
           <span class="control-group__separator">~</span>
           <input class="input ${endHasValueClass}" type="${inputType}" id="${endUniqueId}" name="${endUniqueName}" ${endInputOtherAttrs} ${
      shouldRemoveNativePlaceholderAttr ? "" : `placeholder="${placeholderValue}"`
    } ${endValueAttr} data-placeholder="${placeholderValue}">
        </div>`;
  }

  _generateImageUploadHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    const inputOtherAttrs = this._generateHtmlAttributes({ ...field }, [
      "label",
      "value",
      "preview",
      "maxSizeMB",
      "dialogLayout",
      "colSpan",
      "flexStyle",
      "headerActions",
      "id",
      "name",
      "type",
      "accept",
      "aria-describedby",
    ]);
    const acceptAttr = field.accept ? `accept="${this._escapeHtml(field.accept)}"` : "";
    const previewId = `${uniqueFieldId}-preview`;
    const placeholderId = `${uniqueFieldId}-placeholder`;
    const removeButtonId = `${uniqueFieldId}-remove-btn`;
    const previewContainerId = `${uniqueFieldId}-preview-container`;

    let headerActionButtonsHtml = "";
    if (Array.isArray(field.headerActions)) {
      headerActionButtonsHtml += field.headerActions
        .map((btn) => {
          const btnWithContext = { ...btn, "data-field-id": uniqueFieldId, "data-target-input": field.id };
          return this._generateSingleButtonHtml(btnWithContext);
        })
        .join("");
    }

    const hasLabel = field.label && typeof field.label === "string" && field.label.trim() !== "";
    const hasHeaderActions = Array.isArray(field.headerActions) && field.headerActions.length > 0;
    let fieldHeaderHtml = "";

    if (hasLabel || hasHeaderActions) {
      fieldHeaderHtml = html` <div class="field__header">
        ${hasLabel ? html`<label class="field__label">${this._escapeHtml(field.label)}</label>` : ""}
        ${hasHeaderActions ? html`<div class="field__header-actions">${headerActionButtonsHtml}</div>` : ""}
      </div>`;
    }

    const defaultPlaceholderText = "이미지를 드래그하거나<br>클릭하여 선택";
    let placeholderHtml = this._getIconSvg("uploadCloud") || "";
    placeholderHtml += `<span>${field.placeholder || defaultPlaceholderText}</span>`;

    const imageUploadControlHtml = html`
      <div
        class="image-upload-field__preview-container"
        id="${previewContainerId}"
        data-action="select-image"
        data-target-input="${field.id}"
      >
        <img
          src="#"
          alt="${this._escapeHtml(field.label || field.id)} 미리보기"
          class="image-upload-field__preview"
          id="${previewId}"
          style="display:none;"
        />
        <div class="image-upload-field__placeholder" id="${placeholderId}">${placeholderHtml}</div>
      </div>
      <input
        type="file"
        id="${uniqueFieldId}"
        name="${uniqueFieldName}"
        ${inputOtherAttrs}
        ${acceptAttr}
        class="image-upload-field__input"
        style="display:none;"
        aria-describedby="${uniqueFieldId}-error"
      />
    `;

    return html`
      ${fieldHeaderHtml}
      <div class="field__control-wrapper">
        <div class="image-upload-field-content">${imageUploadControlHtml}</div>
        <span class="field__error-message" id="${uniqueFieldId}-error" role="alert" aria-live="polite"></span>
      </div>
    `;
  }

  // <<< [추가] customHtml 타입 필드 생성기 >>>
  _generateCustomHtml(field /*, dialogType, uniqueFieldId, uniqueFieldName */) {
    // field.html에 정의된 HTML 문자열을 그대로 반환
    // uniqueFieldId, uniqueFieldName 등은 필요시 field.html 내부에서 직접 사용하거나
    // 이 함수에서 field.html을 파싱하여 속성을 주입할 수도 있지만, 여기서는 단순 반환.
    return field.html || "";
  }

  _generateTableContainerHtml(field, dialogType, uniqueFieldId, uniqueFieldName) {
    const allowFileUpload = field.allowFileUpload === true;
    let actionButtonsHtml = "";
    if (Array.isArray(field.tableHeaderActions)) {
      actionButtonsHtml += field.tableHeaderActions
        .map((btn) => {
          const btnWithTableId = { ...btn, "data-table-id": uniqueFieldId };
          return this._generateSingleButtonHtml(btnWithTableId);
        })
        .join("");
    }

    const hasLabel = field.label && typeof field.label === "string" && field.label.trim() !== "";
    const hasHeaderActions = Array.isArray(field.tableHeaderActions) && field.tableHeaderActions.length > 0;
    let fieldHeaderHtml = "";

    if (hasLabel || hasHeaderActions) {
      fieldHeaderHtml = html` <div class="field__header">
        ${hasLabel ? html`<label class="field__label">${this._escapeHtml(field.label)}</label>` : ""}
        ${hasHeaderActions ? html`<div class="field__header-actions">${actionButtonsHtml}</div>` : ""}
      </div>`;
    }

    return html`
      ${fieldHeaderHtml}
      <div class="field__control-wrapper">
        <div class="table-wrapper scroll--common">
          <table class="table" id="${uniqueFieldId}" data-editable="${field.editable === true}">
            <thead class="table__header">
              <tr class="table__row">
                ${(field.columns || [])
                  .map(
                    (col) =>
                      `<th class="table__head-cell ${this._generateCellAlignClass(
                        col,
                        "head-cell",
                      )}" scope="col" style="${this._generateCellStyle(col)}">${this._escapeHtml(col.header)}</th>`,
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody class="table__body"></tbody>
          </table>
        </div>
        ${allowFileUpload
          ? `<input type="file" class="file-input-hidden" multiple data-target-table-id="${uniqueFieldId}" style="display: none;">`
          : ""}
        <span class="field__error-message" id="${uniqueFieldId}-error" role="alert" aria-live="polite"></span>
      </div>
    `;
  }

  _generateButtonsHtml(buttons) {
    return (buttons || []).map((btn) => this._generateSingleButtonHtml(btn)).join("");
  }

  _generateSingleButtonHtml(btn) {
    const btnClasses = ["button"];
    if (btn.class) {
      btn.class.split(" ").forEach((cls) => {
        if (cls) btnClasses.push(cls.startsWith("button--") ? cls : `button--${cls}`);
      });
    } else {
      btnClasses.push("button--secondary"); // 기본 버튼 스타일
    }
    const hasIcon = !!btn.buttonIcon;
    const buttonText = btn.text || btn.buttonText || "";
    if (hasIcon && !buttonText) {
      if (!btnClasses.includes("button--icon")) btnClasses.push("button--icon");
    }
    if (btn.size) {
      btnClasses.push(`button--${btn.size}`);
    }

    // type 결정: btn.type이 있으면 그걸 쓰고, 없으면 action이 'submit'이면 'submit', 아니면 'button'
    const buttonType = btn.type || (btn.action === "submit" ? "submit" : "button");

    const attributesData = {
      ...btn,
      type: buttonType,
      class: [...new Set(btnClasses)].join(" "), // 중복 클래스 제거
      title: btn.title || buttonText,
      "data-action": buttonType !== "submit" ? btn.action : undefined, // type이 submit이 아닐 때만 data-action 설정
    };
    // id는 버튼 정의에 직접 포함된 경우에만 사용
    const buttonAttrs = this._generateHtmlAttributes({ ...attributesData }, [
      "text",
      "buttonText",
      "size",
      "buttonIcon",
      "action",
    ]);
    const iconHtml = hasIcon ? `<div class="button__icon">${this._getIconSvg(btn.buttonIcon)}</div>` : "";
    return `<button ${buttonAttrs}>${iconHtml}${this._escapeHtml(buttonText)}</button>`;
  }

  _getIconSvg(iconName) {
    return ICONS[iconName] || "";
  }

  _renderTableRow(rowData, columns, isEditable, dialogType, tableOriginalId) {
    const rowId = rowData.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const cellsHtml = (columns || [])
      .map((col) => {
        const cellValue = rowData[col.key];
        let cellContent = "";
        if (col.visible && typeof col.visible === "function" && !col.visible(rowData)) {
          return `<td class="table__cell" style="${this._generateCellStyle(col)}"></td>`;
        }
        let displayValue = cellValue;
        if (col.format) {
          displayValue = this._formatValue(cellValue, col.format);
        }
        switch (col.type) {
          case "link":
            const href = rowData[col.linkHrefKey];
            const linkText = this._escapeHtml(cellValue || "");
            if (href) {
              cellContent = `<a href="${this._escapeHtml(href)}" title="${linkText}">${linkText}</a>`;
            } else {
              cellContent = this._escapeHtml(displayValue || col.placeholder || "");
            }
            break;
          case "button":
            if (!isEditable || !col.buttonAction) {
              cellContent = "";
            } else {
              const buttonClasses = ["button"];
              (col.buttonClass || "button--text button--xsmall").split(" ").forEach((cls) => {
                if (cls) buttonClasses.push(cls.startsWith("button--") ? cls : `button--${cls}`);
              });
              const hasIcon = !!col.buttonIcon;
              const buttonText = col.buttonText || "";
              if (hasIcon && !buttonText) {
                if (!buttonClasses.includes("button--icon")) buttonClasses.push("button--icon");
              }
              const iconHtml = hasIcon ? `<div class="button__icon">${this._getIconSvg(col.buttonIcon)}</div>` : "";
              const textHtml = this._escapeHtml(buttonText);
              // 버튼 ID는 필요시 고유하게 생성 (예: `${dialogType}_${tableOriginalId}_${rowId}_${col.buttonAction}`)
              // 여기서는 data-action과 data-row-id로 구분하므로 버튼 자체 ID는 필수는 아님
              cellContent = `<button class="${[...new Set(buttonClasses)].join(" ")}" type="button" data-action="${
                col.buttonAction
              }" data-row-id="${rowId}" title="${col.title || buttonText}">${iconHtml}${textHtml}</button>`;
            }
            break;
          case "text":
          default:
            cellContent = this._escapeHtml(displayValue || "");
            break;
        }
        return `<td class="table__cell ${this._generateCellAlignClass(col, "table__cell")}" style="${this._generateCellStyle(
          col,
        )}">${cellContent}</td>`;
      })
      .join("");
    return `<tr class="table__row" data-row-id="${rowId}">${cellsHtml}</tr>`;
  }

  _handleAddFileClick(dialog, uniqueTableId) {
    const fileInput = dialog.querySelector(`.file-input-hidden[data-target-table-id="${this._escapeHtml(uniqueTableId)}"]`);
    if (fileInput) {
      fileInput.click();
    } else {
      console.error(
        `[DialogManager] 파일 추가 클릭: 테이블(ID: ${uniqueTableId})에 대한 숨겨진 파일 입력(.file-input-hidden)을 찾을 수 없습니다!`,
      );
    }
  }

  _handleImageFileChange(fileInput, dialog, dialogType) {
    const uniqueFieldId = fileInput.id;
    const originalFieldId = uniqueFieldId.substring(dialogType.length + 1);
    const template = this.templates[dialogType];
    const fieldDefinition = template?.fields.find((f) => f.id === originalFieldId);
    const previewImg = dialog.querySelector(`#${uniqueFieldId}-preview`);
    const placeholder = dialog.querySelector(`#${uniqueFieldId}-placeholder`);
    const removeButton = dialog.querySelector(`#${uniqueFieldId}-remove-btn`);
    const errorSpan = dialog.querySelector(`#${uniqueFieldId}-error`);

    if (errorSpan) {
      errorSpan.textContent = "";
      errorSpan.style.display = "none";
      fileInput.closest(".field")?.classList.remove("field--invalid");
      fileInput.removeAttribute("aria-invalid");
    }

    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (fieldDefinition.accept) {
        const acceptedTypes = fieldDefinition.accept.split(",").map((t) => t.trim().toLowerCase());
        if (!acceptedTypes.includes(file.type.toLowerCase())) {
          this._markFieldAsInvalid(fileInput, `허용되지 않는 파일 형식입니다. (${fieldDefinition.accept})`);
          this._clearImagePreview(fileInput, dialog);
          return;
        }
      }
      if (fieldDefinition.maxSizeMB) {
        const maxSizeInBytes = fieldDefinition.maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          this._markFieldAsInvalid(fileInput, `파일 크기는 ${fieldDefinition.maxSizeMB}MB를 초과할 수 없습니다.`);
          this._clearImagePreview(fileInput, dialog);
          return;
        }
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImg) {
          previewImg.src = e.target.result;
          previewImg.style.display = "block";
          previewImg.dataset.hasFile = "true";
        }
        if (placeholder) placeholder.style.display = "none";
        if (removeButton) removeButton.style.display = "inline-flex";
      };
      reader.readAsDataURL(file);
    } else {
      this._clearImagePreview(fileInput, dialog);
    }
  }

  _clearImagePreview(fileInputOrUniqueId, dialogInstance) {
    const dialog =
      dialogInstance ||
      (typeof fileInputOrUniqueId === "object"
        ? fileInputOrUniqueId.closest("dialog")
        : document.getElementById(fileInputOrUniqueId)?.closest("dialog"));
    if (!dialog) return;
    const uniqueId = typeof fileInputOrUniqueId === "string" ? fileInputOrUniqueId : fileInputOrUniqueId.id;
    const fileInput = typeof fileInputOrUniqueId === "string" ? dialog.querySelector(`#${uniqueId}`) : fileInputOrUniqueId;

    if (fileInput) fileInput.value = null;
    const previewImg = dialog.querySelector(`#${uniqueId}-preview`);
    const placeholder = dialog.querySelector(`#${uniqueId}-placeholder`);
    const removeButton = dialog.querySelector(`#${uniqueId}-remove-btn`);
    if (previewImg) {
      previewImg.src = "#";
      previewImg.style.display = "none";
      delete previewImg.dataset.hasFile;
      delete previewImg.dataset.initialUrl;
    }
    if (placeholder) placeholder.style.display = "flex";
    if (removeButton) removeButton.style.display = "none";
    const errorSpan = dialog.querySelector(`#${uniqueId}-error`);
    if (errorSpan) {
      errorSpan.textContent = "";
      errorSpan.style.display = "none";
      fileInput?.closest(".field")?.classList.remove("field--invalid");
      fileInput?.removeAttribute("aria-invalid");
    }
  }

  _initializeFormValues(formContainer, template, initialData, dialogType) {
    if (!template) return;
    // dialogType은 이제 명시적으로 받음. formContainer가 dialog일 수도, 일반 div일 수도 있음.

    template.fields.forEach((field) => {
      const originalFieldId = field.id;
      const fieldType = field.type || "default";
      const initializer = this._fieldInitializers[fieldType] || this._fieldInitializers["default"];
      let valueToSet;

      if (initialData && initialData.hasOwnProperty(originalFieldId)) {
        valueToSet = initialData[originalFieldId];
      } else {
        if (fieldType === "table" && field.rows && Array.isArray(field.rows)) {
          valueToSet = field.rows;
        } else if (field.hasOwnProperty("defaultValue")) {
          valueToSet = field.defaultValue;
        } else if (field.hasOwnProperty("value") && fieldType !== "table") {
          // 테이블의 value는 rows로 처리
          valueToSet = field.value;
        } else if (fieldType === "checkbox" && field.hasOwnProperty("checked")) {
          valueToSet = field.checked;
        } else if (fieldType === "table") {
          valueToSet = [];
        }
      }

      if (initializer) {
        try {
          initializer.call(this, formContainer, field, valueToSet, dialogType);
        } catch (error) {
          console.error(`[DialogManager] _initializeFormValues: 필드 "${originalFieldId}" 값 설정 중 오류:`, error);
        }
      } else {
        console.warn(
          `[DialogManager] _initializeFormValues: 필드 타입 "${fieldType}"에 대한 초기화 함수(initializer)가 없습니다.`,
        );
      }
    });
    formContainer // dialog -> formContainer
      .querySelectorAll('.input[type="date"], .input[type="datetime-local"], .input[type="month"], .input[type="number"]')
      .forEach(this._updateDateInputState);
  }

  _populateTable(formContainer, field, tableData, dialogType) {
    const uniqueTableId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const tableElement = formContainer.querySelector(`#${uniqueTableId}`); // dialog -> formContainer
    if (!tableElement) {
      console.error(
        `[DialogManager] _populateTable: 테이블 요소를 찾을 수 없습니다. (ID: ${field.id}, UniqueID: ${uniqueTableId})`,
      );
      return;
    }
    const tableBody = tableElement.querySelector("tbody.table__body");
    const isEditable = tableElement.dataset.editable === "true";
    const columns = field.columns;
    if (!tableBody) {
      console.error(`[DialogManager] 테이블 채우기: 테이블 본문(tbody)을 찾을 수 없습니다. (ID: ${field.id})`);
      return;
    }
    const rows = Array.isArray(tableData) ? tableData : tableData && Array.isArray(tableData.rows) ? tableData.rows : [];
    tableBody.innerHTML = "";
    if (rows.length === 0) {
      this._addNoDataRow(tableBody);
    }
    rows.forEach((rowData) => {
      const rowHtml = this._renderTableRow(rowData, columns, isEditable, dialogType, field.id);
      if (rowHtml) tableBody.insertAdjacentHTML("beforeend", rowHtml);
    });
  }

  _addNoDataRow(tableBody) {
    if (!tableBody) return;
    const columnCount = tableBody.closest("table.table")?.querySelector("thead tr")?.children.length || 1;
    tableBody.innerHTML = `<tr class="table__row table__row--no-data"><td class="table__cell" colspan="${columnCount}">데이터가 없습니다.</td></tr>`;
  }

  _setInputFieldValue(formContainer, field, value, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const element = formContainer.querySelector(`#${uniqueFieldId}`); // dialog -> formContainer
    if (element && "value" in element) {
      element.value = value === null || value === undefined ? "" : value;
      if (element.matches('.input[type="date"], .input[type="datetime-local"], .input[type="month"], .input[type="number"]'))
        this._updateDateInputState(element);
    }
  }

  _setSelectValue(formContainer, field, value, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const element = formContainer.querySelector(`#${uniqueFieldId}`); // dialog -> formContainer
    if (element && element.tagName === "SELECT") {
      element.value = value;
    }
  }

  _setRadioGroupValue(formContainer, field, value, dialogType) {
    const uniqueFieldName = this._getUniqueElementName(dialogType, field); // dialogType은 파라미터로 받음
    const elements = formContainer.querySelectorAll(`input[name="${uniqueFieldName}"][type="radio"]`); // dialog -> formContainer
    if (elements.length > 0) {
      const stringValue = String(value);
      elements.forEach((el) => {
        el.checked = el.value === stringValue;
      });
    }
  }
  _setCheckboxGroupValue(formContainer, field, value, dialogType) {
    const uniqueFieldName = this._getUniqueElementName(dialogType, field); // dialogType은 파라미터로 받음
    const elements = formContainer.querySelectorAll(`input[name="${uniqueFieldName}"][type="checkbox"]`); // dialog -> formContainer
    if (elements.length > 0) {
      const valuesToCheck = Array.isArray(value)
        ? value.map(String)
        : value !== null && value !== undefined
        ? [String(value)]
        : [];
      elements.forEach((el) => {
        el.checked = valuesToCheck.includes(el.value);
      });
    }
  }
  _setSingleCheckboxValue(formContainer, field, value, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const element = formContainer.querySelector(`#${uniqueFieldId}`); // dialog -> formContainer
    if (element && element.type === "checkbox") {
      element.checked = value === true;
    }
  }

  _setDateRangeValue(formContainer, field, value, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const startInput = formContainer.querySelector(`#${uniqueFieldId}_start`); // dialog -> formContainer
    const endInput = formContainer.querySelector(`#${uniqueFieldId}_end`); // dialog -> formContainer
    if (startInput && endInput) {
      if (value && typeof value === "object" && value.hasOwnProperty("start") && value.hasOwnProperty("end")) {
        startInput.value = value.start || "";
        endInput.value = value.end || "";
        // ✨ 값 설정 후 상태 업데이트 (date, datetime-local, month 타입인 경우에만)
        if (['date', 'datetime-local', 'month'].includes(startInput.type)) this._updateDateInputState(startInput);
        if (['date', 'datetime-local', 'month'].includes(endInput.type)) this._updateDateInputState(endInput);
      } else {
        startInput.value = "";
        endInput.value = "";
        // ✨ 값 비울 때도 상태 업데이트
        if (['date', 'datetime-local', 'month'].includes(startInput.type)) this._updateDateInputState(startInput);
        if (['date', 'datetime-local', 'month'].includes(endInput.type)) this._updateDateInputState(endInput);
        if (value !== null && value !== undefined) {
          console.warn(
            `DialogManager._setDateRangeValue: 날짜 범위 필드 "${field.id}" 데이터 형식이 잘못됨 ({start, end} 필요). 받은 값:`,
            value,
          );
        }
      }
    }
  }

  _setInputGroupValue(formContainer, field, value, dialogType) {
    if (value && typeof value === "object" && Array.isArray(field.items)) {
      field.items.forEach((item) => {
        if ((item.type === "input" || item.type === "select") && item.id) {
          const uniqueItemId = this._getUniqueElementId(dialogType, `${field.id}_${item.id}`); // dialogType은 파라미터로 받음
          const element = formContainer.querySelector(`#${uniqueItemId}`); // dialog -> formContainer
          if (element) {
            element.value = value[item.id] === null || value[item.id] === undefined ? "" : value[item.id];
          }
        }
      });
    } else {
      field.items?.forEach((item) => {
        if ((item.type === "input" || item.type === "select") && item.id) {
          const uniqueItemId = this._getUniqueElementId(dialogType, `${field.id}_${item.id}`); // dialogType은 파라미터로 받음
          const element = formContainer.querySelector(`#${uniqueItemId}`); // dialog -> formContainer
          if (element) element.value = "";
        }
      });
      if (value !== null && value !== undefined) {
        console.warn(
          `[DialogManager] Input 그룹 값 설정: 필드 "${field.id}" 데이터 형식이 잘못되었습니다. (객체 필요). 받은 값:`,
          value,
        );
      }
    }
  }

  _setImageUploadValue(formContainer, field, value, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    this._clearImagePreview(uniqueFieldId, formContainer); // dialog -> formContainer
    if (typeof value === "string" && value) {
       const previewImg = formContainer.querySelector(`#${uniqueFieldId}-preview`); // dialog -> formContainer
      const placeholder = formContainer.querySelector(`#${uniqueFieldId}-placeholder`); // dialog -> formContainer
      const removeButton = formContainer.querySelector(`#${uniqueFieldId}-remove-btn`); // dialog -> formContainer
      if (previewImg) {
        previewImg.src = value;
        previewImg.style.display = "block";
        previewImg.dataset.initialUrl = value;
      }
      if (placeholder) placeholder.style.display = "none";
      if (removeButton) removeButton.style.display = "inline-flex";
    }
  }

  // <<< [추가] customHtml 타입 필드 초기화 함수 (현재는 특별한 동작 없음) >>>
  _initializeCustomHtml(/* formContainer, field, value, dialogType */) {
    // customHtml 타입은 주로 정적 HTML을 표시하므로,
    // 별도의 초기화 로직이 필요 없을 수 있음.
    // 필요하다면 여기에 로직 추가 (예: 내부 요소에 이벤트 리스너 바인딩 등)
    // console.debug(`[DialogManager] _initializeCustomHtml: 필드 "${field.id}" 초기화 (동작 없음)`);
  }

  _collectFormData(formElement, dialogType) {
    const formDataObject = {};
    const template = this.templates[dialogType]; // dialogType은 파라미터로 받음. formElement.closest('dialog') 불필요.
    if (!template) return formDataObject;

    template.fields.forEach((field) => {
      const originalFieldId = field.id;
      const fieldType = field.type || "default";
      const collector = this._fieldCollectors[fieldType] || this._fieldCollectors["default"];
      if (collector) {
        try {
          formDataObject[originalFieldId] = collector.call(this, formElement, field, dialogType);
        } catch (error) {
          console.error(`[DialogManager] 폼 데이터 수집: 필드 "${originalFieldId}" 값 수집 중 오류:`, error);
          formDataObject[originalFieldId] = undefined;
        }
      } else {
        console.warn(`[DialogManager] 폼 데이터 수집: 필드 타입 "${fieldType}"에 대한 수집 함수(collector)가 없습니다.`);
      }
    });
    return formDataObject;
  }

  _getInputFieldValue(formElement, field, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const element = formElement.querySelector(`#${uniqueFieldId}`); // form -> formElement
    return element ? element.value : undefined;
  }

  _getSelectValue(formElement, field, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const element = formElement.querySelector(`#${uniqueFieldId}`); // form -> formElement
    return element ? element.value : undefined;
  }

  _getRadioGroupValue(formElement, field, dialogType) {
    const uniqueFieldName = this._getUniqueElementName(dialogType, field); // dialogType은 파라미터로 받음
    const checkedElement = formElement.querySelector(`input[name="${uniqueFieldName}"][type="radio"]:checked`); // form -> formElement
    return checkedElement ? checkedElement.value : undefined;
  }

  _getCheckboxGroupValue(formElement, field, dialogType) {
    const uniqueFieldName = this._getUniqueElementName(dialogType, field); // dialogType은 파라미터로 받음
    const checkedElements = formElement.querySelectorAll(`input[name="${uniqueFieldName}"][type="checkbox"]:checked`); // form -> formElement
    return Array.from(checkedElements).map((el) => el.value);
  }

  _getSingleCheckboxValue(formElement, field, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const element = formElement.querySelector(`#${uniqueFieldId}`); // form -> formElement
    return element ? element.checked : false;
  }

  _getDateRangeValue(formElement, field, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const startInput = formElement.querySelector(`#${uniqueFieldId}_start`); // form -> formElement
    const endInput = formElement.querySelector(`#${uniqueFieldId}_end`); // form -> formElement
    return {
      start: startInput?.value || "",
      end: endInput?.value || "",
    };
  }

  _getInputGroupValue(formElement, field, dialogType) {
    const groupData = {};
    if (Array.isArray(field.items)) {
      field.items.forEach((item) => {
        if ((item.type === "input" || item.type === "select") && item.id) {
          const uniqueItemId = this._getUniqueElementId(dialogType, `${field.id}_${item.id}`);
          groupData[item.id] = form.querySelector(`#${uniqueItemId}`)?.value || "";
          groupData[item.id] = formElement.querySelector(`#${uniqueItemId}`)?.value || ""; // form -> formElement
        }
      });
    }
    return groupData;
  }

  _getImageUploadValue(formElement, field, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const fileInput = formElement.querySelector(`#${uniqueFieldId}`); // form -> formElement
    const previewImg = formElement.querySelector(`#${uniqueFieldId}-preview`); // form -> formElement
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      return fileInput.files[0];
    } else if (previewImg && previewImg.dataset.initialUrl) {
      return previewImg.dataset.initialUrl;
    }
    return null;
  }

  _collectTableData(formElement, field, dialogType) {
    const uniqueTableId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const table = formElement.querySelector(`#${uniqueTableId}`); // form -> formElement
    if (!table) {
      console.warn(
        `[DialogManager] _collectTableData: 테이블 요소를 찾을 수 없습니다. (ID: ${field.id}, UniqueID: ${uniqueTableId})`,
      );
      return [];
    }

    const columns = field.columns;
    if (!Array.isArray(columns) || columns.length === 0) {
      console.warn(`[DialogManager] _collectTableData: 테이블(ID: ${field.id})에 대한 컬럼 정의가 없거나 유효하지 않습니다.`);
      return [];
    }

    const rowsData = [];
    table.querySelectorAll("tbody.table__body tr.table__row:not(.table__row--no-data)").forEach((row) => {
      const cells = row.querySelectorAll("td.table__cell");
      const rowData = { id: row.dataset.rowId };

      columns.forEach((col, index) => {
        if (cells[index] && col.key) {
          rowData[col.key] = cells[index].textContent.trim();
        }
      });
      rowsData.push(rowData);
    });
    return rowsData;
  }

  // <<< [추가] customHtml 타입 필드 데이터 수집 함수 (현재는 특별한 동작 없음) >>>
  _collectCustomHtmlData(/* formElement, field, dialogType */) {
    // customHtml 타입은 일반적으로 사용자 입력을 받지 않으므로,
    // 수집할 데이터가 없을 수 있음.
    // 필요하다면 여기에 로직 추가
    return undefined; // 또는 field.id에 해당하는 특정 값을 반환할 수도 있음
  }

  _validateForm(formElement, dialogType) {
    let isOverallValid = true;
    const template = this.templates[dialogType]; // dialogType은 파라미터로 받음
    if (!template) return false;

    formElement.querySelectorAll(".input, .textarea, .select, .checkbox__input").forEach((element) => { // form -> formElement
      if (element.type === "hidden" || element.disabled || element.closest(".dialog__footer")) return;
      if (
        element.closest(".control-group") &&
        !element.closest(".control-group--input") &&
        !element.closest(".control-group--date-range")
      )
        return;
      if (!element.checkValidity()) {
        isOverallValid = false;
        const message = element.validationMessage || "입력값을 확인해주세요.";
        this._markFieldAsInvalid(element, message, dialogType);
      }
    });

    template.fields.forEach((field) => {
      let fieldIsValid = true;
      const uniqueFieldId = this._getUniqueElementId(dialogType, field.id);

      if (field.required && ["radio-group", "checkbox-group"].includes(field.type)) {
        fieldIsValid = this._validateRequiredGroup(formElement, field, dialogType);
      } else if (field.type === "date-range") {
        fieldIsValid = this._validateDateRange(formElement, field, dialogType);
      } else if (field.required && field.type === "checkbox") {
        const checkbox = formElement.querySelector(`#${uniqueFieldId}`);
        if (checkbox && !checkbox.checked) {
          fieldIsValid = false;
          this._markFieldAsInvalid(checkbox, "필수 동의 항목입니다.", dialogType);
        }
      } else if (field.type === "table" && field.required) {
        const tableBody = formElement.querySelector(`#${uniqueFieldId} tbody.table__body`);
        if (tableBody && (tableBody.querySelector(".table__row--no-data") || tableBody.children.length === 0)) {
          fieldIsValid = false;
          this._markContainerAsInvalid(tableBody.closest(".field"), "최소 하나 이상의 항목이 필요합니다.");
        }
      } else if (field.type === "image-upload" && field.required) {
        const fileInput = formElement.querySelector(`#${uniqueFieldId}`);
        const previewImg = formElement.querySelector(`#${uniqueFieldId}-preview`);
        if (!fileInput?.files?.[0] && !previewImg?.dataset.initialUrl) {
          fieldIsValid = false;
          this._markFieldAsInvalid(fileInput, "필수 이미지 항목입니다.", dialogType);
        }
      }
      if (!fieldIsValid) isOverallValid = false;
    });

    const formDataObject = this._collectFormData(formElement, dialogType);
    template.fields.forEach((field) => {
      if (typeof field.validate === "function") {
        const uniqueFieldId = this._getUniqueElementId(dialogType, field.id);
        const element = formElement.querySelector(`#${uniqueFieldId}`);
        const currentValue = formDataObject[field.id];
        const validationResult = field.validate(currentValue, formDataObject);
        if (validationResult !== true) {
          isOverallValid = false;
          const fieldContainer = formElement.querySelector(`[data-field-id="${field.id}"]`);
          const targetElementForError = element || fieldContainer;
          if (targetElementForError)
            this._markFieldAsInvalid(
              targetElementForError,
              typeof validationResult === "string" ? validationResult : "유효성 검사 실패",
              dialogType
            );
        }
      }
    });
    return isOverallValid;
  }

  _validateRequiredGroup(formElement, field, dialogType) {
    const uniqueFieldName = this._getUniqueElementName(dialogType, field); // dialogType은 파라미터로 받음
    const groupInputs = formElement.querySelectorAll(`input[name="${uniqueFieldName}"]`); // form -> formElement
    if (groupInputs.length === 0) return true;
    const groupType = field.type === "radio-group" ? "radio" : "checkbox";
    const isChecked = Array.from(groupInputs).some((input) => input.checked);
    if (!isChecked) {
      const message = groupType === "radio" ? "필수 선택 항목입니다." : "하나 이상 선택해주세요.";
      const fieldContainer = groupInputs[0].closest(".field");
      if (fieldContainer) this._markContainerAsInvalid(fieldContainer, message, dialogType);
      return false;
    }
    return true;
  }

  _validateDateRange(formElement, field, dialogType) {
    const uniqueFieldId = this._getUniqueElementId(dialogType, field.id); // dialogType은 파라미터로 받음
    const startInput = formElement.querySelector(`#${uniqueFieldId}_start`); // form -> formElement
    const endInput = formElement.querySelector(`#${uniqueFieldId}_end`); // form -> formElement
    const fieldContainer = startInput?.closest(".field");
    if (!startInput || !endInput || !fieldContainer) return true;
    const granularity = field.granularity || "date";
    let isValid = true;
    let errorMessage = "";
    const startValue = startInput.value;
    const endValue = endInput.value;

    if (field.required) {
      if (!startValue && !endValue) {
        isValid = false;
        errorMessage = "시작 값과 종료 값을 모두 입력해주세요.";
        startInput.classList.add("input--invalid");
        endInput.classList.add("input--invalid");
      } else if (!startValue) {
        isValid = false;
        errorMessage = "시작 값을 입력해주세요.";
        startInput.classList.add("input--invalid");
      } else if (!endValue) {
        isValid = false;
        errorMessage = "종료 값을 입력해주세요.";
        endInput.classList.add("input--invalid");
      }
    }

    if (startValue && endValue && isValid) {
      let comparisonValid = true;
      if (granularity === "year") {
        const startYear = parseInt(startValue, 10);
        const endYear = parseInt(endValue, 10);
        if (!/^\d{4}$/.test(startValue)) {
          comparisonValid = false;
          errorMessage = "시작 연도는 4자리 숫자로 입력해주세요.";
          startInput.classList.add("input--invalid");
        }
        if (!/^\d{4}$/.test(endValue)) {
          comparisonValid = false;
          errorMessage = errorMessage || "종료 연도는 4자리 숫자로 입력해주세요.";
          endInput.classList.add("input--invalid");
        }
        if (comparisonValid && !isNaN(startYear) && !isNaN(endYear) && endYear < startYear) {
          comparisonValid = false;
          errorMessage = "종료 연도는 시작 연도보다 빠를 수 없습니다.";
        }
      } else {
        if (endValue < startValue) {
          comparisonValid = false;
          let unit = "날짜";
          if (granularity === "datetime") unit = "시간";
          else if (granularity === "month") unit = "월";
          errorMessage = `종료 ${unit}는(은) 시작 ${unit}보다 빠를 수 없습니다.`;
        }
      }
      if (!comparisonValid) {
        isValid = false;
        if (granularity !== "year" || errorMessage.includes("빠를 수 없습니다")) {
          startInput.classList.add("input--invalid");
          endInput.classList.add("input--invalid");
        }
      }
    }
    if (!isValid) this._markContainerAsInvalid(fieldContainer, errorMessage, dialogType);
    return isValid;
  }

  _markFieldAsInvalid(element, message, dialogType) {
    element?.setAttribute("aria-invalid", "true");
    const fieldContainer = element.closest(".field");
    if (fieldContainer) {
      this._markContainerAsInvalid(fieldContainer, message, dialogType);
    } else {
      console.warn("[DialogManager] 필드 오류 표시: 오류를 표시할 .field 컨테이너를 찾지 못했습니다. 대상 요소:", element);
    }
  }

  _markContainerAsInvalid(container, message, dialogType) {
    container.classList.add("field--invalid");
    const originalFieldId = container.dataset.fieldId;
    const uniqueErrorSpanId = this._getUniqueElementId(dialogType, originalFieldId, "-error");
    const errorSpan = container.querySelector(`#${uniqueErrorSpanId}`);
    if (errorSpan) {
      errorSpan.textContent = message;
      errorSpan.style.display = "block";
    } else {
      console.warn(
        "[DialogManager] 컨테이너 오류 표시: 오류 메시지를 표시할 .field__error-message span을 찾지 못했습니다. 대상 컨테이너:",
        container,
      );
    }
  }

  _clearValidationErrors(formElement) {
    formElement.querySelectorAll("[id$='-error']").forEach((el) => { // form -> formElement
      // uniqueId 기반으로 찾아야 함
      el.textContent = "";
      el.style.display = "none";
    });
    formElement.querySelectorAll(".field--invalid").forEach((el) => { // form -> formElement
      el.classList.remove("field--invalid");
    });
    formElement
      .querySelectorAll(".input--invalid, .textarea--invalid, .select--invalid, .control-group--invalid-item")
      .forEach((el) => {
        el.classList.remove("input--invalid", "textarea--invalid", "select--invalid", "control-group--invalid-item");
      });
    formElement.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.removeAttribute("aria-invalid");
    });
  }

  _escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _generateCellStyle(column) {
    let styles = [];
    if (column.width) {
      styles.push(`width: ${column.width}`);
    }
    return styles.join("; ");
  }

  _generateCellAlignClass(column, baseClassPrefix) {
    if (column.align) {
      return `${baseClassPrefix}--align-${column.align}`;
    }
    return "";
  }

  _formatValue(value, formatType) {
    switch (formatType) {
      case "fileSize":
        return this._formatFileSize(value);
      case "date":
      case "datetime":
      case "datetimeShort":
        return this._formatDateTime(value, formatType);
      case "number":
      case "currency":
        return this._formatNumber(value, formatType);
      default:
        return String(value === null || value === undefined ? "" : value);
    }
  }

  _formatDateTime(value, formatType) {
    if (value === null || value === undefined || value === "") return "";
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);
      const options = { year: "numeric", month: "2-digit", day: "2-digit", hour12: false };
      if (formatType === "datetime" || formatType === "datetimeShort") {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      if (formatType === "datetime") {
        options.second = "2-digit";
      }
      return new Intl.DateTimeFormat("ko-KR", options).format(date).replace(/\. /g, "-").replace(".", "");
    } catch (error) {
      console.error(`[DialogManager] 날짜 포맷팅 오류 (값: ${value}, 형식: ${formatType}):`, error);
      return String(value);
    }
  }

  _formatNumber(value, formatType) {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    const options = { style: formatType === "currency" ? "currency" : "decimal" };
    if (formatType === "currency") options.currency = "KRW";
    return new Intl.NumberFormat("ko-KR", options).format(num);
  }

  _formatFileSize(bytesStr) {
    const bytes = Number(bytesStr);
    if (isNaN(bytes) || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  _generateHtmlAttributes(fieldDefinition, excludeAttrs = []) {
    const attributes = [];
    const booleanAttributes = ["required", "disabled", "readonly", "checked", "multiple", "selected"];
    // id, name, type, value, placeholder, rows, accept, aria-describedby 등은 각 생성 함수에서 직접 처리하므로 제외 목록에 추가
    const internalKeys = ["id", "name"];

    for (const key in fieldDefinition) {
      if (
        !Object.prototype.hasOwnProperty.call(fieldDefinition, key) ||
        internalKeys.includes(key) ||
        excludeAttrs.includes(key)
      ) {
        continue;
      }
      const value = fieldDefinition[key];
      if (booleanAttributes.includes(key)) {
        if (value === true) attributes.push(key);
      } else if (key.startsWith("data-")) {
        if (value !== null && value !== undefined && value !== false) {
          attributes.push(`${this._escapeHtml(key)}="${this._escapeHtml(String(value))}"`);
        }
      } else if (key === "style" && typeof value === "object" && value !== null) {
        const styleString = Object.entries(value)
          .map(([prop, val]) => `${prop.replace(/([A-Z])/g, "-$1").toLowerCase()}:${this._escapeHtml(String(val))}`)
          .join(";");
        if (styleString) attributes.push(`style="${styleString}"`);
      } else if (
        value !== null &&
        value !== undefined &&
        value !== false &&
        typeof value !== "object" &&
        typeof value !== "function"
      ) {
        attributes.push(`${this._escapeHtml(key)}="${this._escapeHtml(String(value))}"`);
      }
    }
    return attributes.join(" ");
  }

  _findLongestLabelFromTemplate(templateObject) {
    let longestLabelText = "";
    let maxLength = 0;
    if (templateObject && Array.isArray(templateObject.fields)) {
      templateObject.fields.forEach((field) => {
        const isExplicitlyVertical = field.layout === "vertical";
        const isVerticalNatureType = ["table", "image-upload"].includes(field.type); // textarea 추가
        const considerForLength = !isExplicitlyVertical && !isVerticalNatureType;

        if (field && typeof field.label === "string" && field.label.trim() !== "" && considerForLength) {
          const currentLength = field.label.length;
          if (currentLength > maxLength) {
            maxLength = currentLength;
            longestLabelText = field.label;
          }
        }
      });
    }
    return { text: longestLabelText, length: maxLength };
  }
}

DialogManager.prototype._updateDateInputState = function (inputElement) {
  if (!inputElement) return;
  // ✨ 핵심 변경: inputElement.value가 실제로 비어있는 문자열인지 확인!
  //    (type="date" 같은 경우, 값이 없어도 value가 빈 문자열이 아닐 수 있음 - 브라우저 기본값)
  //    하지만 사용자가 값을 지우면 빈 문자열이 되므로, 빈 문자열일 때도 has-value를 제거해야 함.
  inputElement.classList.toggle("has-value", inputElement.value !== "");
};

export default DialogManager;
