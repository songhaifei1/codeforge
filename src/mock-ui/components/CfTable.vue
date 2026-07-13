<template>
  <div class="cf-table-wrapper">
    <table class="cf-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.prop"
            :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in data" :key="rowIndex">
          <td
            v-for="col in columns"
            :key="col.prop"
            :style="{ textAlign: col.align || 'left' }"
          >
            <slot :name="col.prop" :row="row" :index="rowIndex">
              {{ row[col.prop] }}
            </slot>
          </td>
        </tr>
        <tr v-if="!data || data.length === 0">
          <td :colspan="columns.length" class="cf-table__empty">暂无数据</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
export interface TableColumn {
  prop: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

defineProps<{
  data: Record<string, any>[]
  columns: TableColumn[]
}>()
</script>

<style scoped>
.cf-table-wrapper {
  width: 100%;
  overflow-x: auto;
}
.cf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.cf-table th {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}
.cf-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
}
.cf-table tbody tr:hover {
  background: #f5f5f5;
}
.cf-table__empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style>
