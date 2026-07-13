import type { App } from 'vue'

import CfButton from './components/CfButton.vue'
import CfInput from './components/CfInput.vue'
import CfSelect from './components/CfSelect.vue'
import CfDatePicker from './components/CfDatePicker.vue'
import CfTable from './components/CfTable.vue'
import CfTag from './components/CfTag.vue'
import CfCard from './components/CfCard.vue'
import CfModal from './components/CfModal.vue'
import CfPagination from './components/CfPagination.vue'
import CfForm from './components/CfForm.vue'
import CfFormItem from './components/CfFormItem.vue'

export {
  CfButton,
  CfInput,
  CfSelect,
  CfDatePicker,
  CfTable,
  CfTag,
  CfCard,
  CfModal,
  CfPagination,
  CfForm,
  CfFormItem,
}

export const allComponents = {
  CfButton,
  CfInput,
  CfSelect,
  CfDatePicker,
  CfTable,
  CfTag,
  CfCard,
  CfModal,
  CfPagination,
  CfForm,
  CfFormItem,
}

export function installMockUI(app: App) {
  for (const [name, component] of Object.entries(allComponents)) {
    // Convert PascalCase to kebab-case
    const kebabName = name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)
    app.component(kebabName, component as any)
    app.component(name, component as any)
  }
}
