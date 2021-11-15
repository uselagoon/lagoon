package schema

type Workflow struct {
	Id int `json:"id"`
	Event String `json:"event"`
	Project int `json:"project"`
	AdvancedTaskDefinition int `json:"advanced_task_definition"`
}
