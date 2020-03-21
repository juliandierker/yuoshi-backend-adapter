import AsyncIterableWrapper from "../../helpers/AsyncIterableWrapper"
import { NSTaskContentAdapter } from "../AbstractTaskContentAdapter"

import { NSTaskContentQuestAdapter } from "../AbstractTaskContentQuestAdapter"
import { AsyncBaseTask, StaticBaseTask } from "./BaseTask"
import { NSUserTaskSolution } from "../AbstractUserTaskSolutionAdapter"

interface CategoryItems {
	id: string,
	title: string
}

interface StatementItems {
	id: string,
	text: string
}

class StaticDrag extends StaticBaseTask<{
	categories: CategoryItems[]
	statements: StatementItems[]
}> {
	readonly isTraining: boolean = false
	readonly type: string = "drag"

	public categories: CategoryItems[]
	public statements: StatementItems[]

	protected init(contents: { categories: CategoryItems[]; statements: StatementItems[] }): void {
		this.categories = contents.categories
		this.statements = contents.statements
	}
}

export class Drag extends AsyncBaseTask<StaticDrag> {
	public readonly type: string = "drag"
	public readonly isTraining: boolean = false
	public categories: AsyncIterableWrapper<CategoryItems>
	public statements: AsyncIterableWrapper<StatementItems>

	protected init(contents: AsyncIterableWrapper<NSTaskContentAdapter.TaskContent>): void {
		async function* iterateCategories() {
			for await (const content of contents) {
				for await (const quest of content.quests) {
					yield {
						id: quest.id,
						content_id: content.id,
						title: quest.question,
					}
				}
			}
		}

		this.categories = AsyncIterableWrapper.fromAsyncIterable(
			iterateCategories()
		)

		async function* iterateStatements() {
			for await (const content of contents) {
				for await (const quest of content.quests) {
					for await (const answer of quest.answers) {
						yield {
							id: answer.id,
							text: answer.content,
						}
					}
				}
			}
		}

		this.statements = AsyncIterableWrapper.fromAsyncIterable(
			iterateStatements()
		)
	}

	async getStatic(): Promise<StaticDrag> {
		return new StaticDrag({
			...this,
			contents: {
				categories: await this.categories.toArray(),
				statements: await this.statements.toArray(),
			}
		});
	}

	createAnswer(answers: {
		category_id: string,
		content_id: string,
		items: string[]
	}[]): NSUserTaskSolution.UserTaskSolutionModel {
		return this.createSolutionFromContentAnswers(answers
			.reduce((acc, item) => {
				item.items.forEach((answer, index) => {
					acc.push({
						sequence: index,
						content_id: item.content_id,
						quest_id: item.category_id,
						answer_id: answer
					})
				})

				return acc
			}, []))
	}
}
