import AuthenticationHandlerInterface from "../interfaces/AuthenticationHandlerInterface"
import { DefaultEntity, DefaultYuoshiAdapter } from "./DefaultYuoshiAdapter"
import AsyncIterableWrapper from "../helpers/AsyncIterableWrapper"

interface UserTaskContentQuestSolution extends DefaultEntity<never> {
	content_solution_id: string
	quest_id: string
	answer_id: string
}

interface UserTaskContentSolution extends DefaultEntity<never> {
	task_solution_id: string
	content_id: string
	value?: string
	quests: AsyncIterableWrapper<Omit<UserTaskContentQuestSolution, "content_solution_id">>
}

export namespace NSUserTaskSolution {
	export interface UserTaskSolution extends DefaultEntity<never> {
		task_id: string
		contents: AsyncIterableWrapper<Omit<UserTaskContentSolution, "task_solution_id">>
	}

	// splitting up the union-type-def into multiple interfaces seems to be
	// necessary as of typescript 3.8. feel free to shorten this when it becomes
	// possible!

	interface BaseAnswer {
		quest_id: string
		sequence?: number
	}

	interface NormalAnswer extends BaseAnswer {
		answer_id: string
		custom: never
	}

	interface CustomAnswer extends BaseAnswer {
		custom: string
		answer_id: never
	}

	type Answer = NormalAnswer | CustomAnswer

	interface BaseContent {
		content_id: string
		value?: string
		answers?: Answer[]
	}

	interface ContentWithValue extends BaseContent {
		value: string
	}

	interface ContentWithAnswers extends BaseContent {
		answers: Answer[]
	}

	type Content = ContentWithAnswers | ContentWithValue

	export interface UserTaskSolutionModel {
		task_id: string
		contents?: Content[]
	}

	export abstract class AbstractUserTaskSolutionAdapter<RequestConfigType, AuthenticationHandler extends AuthenticationHandlerInterface> extends DefaultYuoshiAdapter<RequestConfigType, AuthenticationHandler> {
		public abstract saveSolution(solution: UserTaskSolutionModel): Promise<void>
	}
}
