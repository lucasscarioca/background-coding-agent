import { generateText, stepCountIs, tool } from 'ai'
import { google } from '@ai-sdk/google'
import z from 'zod/v4'
import {
	createPR,
	createSandbox,
	editFile,
	listFiles,
	readFile,
} from './sandbox'
import { Sandbox } from '@vercel/sandbox'

export async function bgCodingAgent(prompt: string, repoUrl: string) {
	let sandbox: Sandbox | undefined

	const result = await generateText({
		model: google('gemini-2.5-flash'),
		prompt,
		system: `You are a coding agent. Your responses must be concise. 
		Use your given tools to understand the working directory and complete the given task.
		Do not answer questions that are not coding related.
    IMPORTANT: If you make changes to the codebase, be sure to run the create_pr tool once you are done.`.trim(),
		tools: {
			list_files: tool({
				description:
					'List files and directories at a given path. If no path is provided, lists files in the current directory.',
				inputSchema: z.object({
					path: z
						.string()
						.nullish()
						.describe(
							'Optional relative path to list files from. Defaults to current directory if not provided.'
						),
				}),
				execute: async ({ path: generatedPath }) => {
					if (
						generatedPath &&
						['.git', 'node_modules'].includes(generatedPath)
					) {
						return {
							error: 'You cannot read the path: ' + generatedPath,
						}
					}

					const path = generatedPath?.trim() ? generatedPath : '.'
					try {
						if (!sandbox) sandbox = await createSandbox(repoUrl)
						const output = await listFiles(sandbox, path)
						return { path, output }
					} catch (e) {
						console.error('Error listing files:', e)
						return { error: e }
					}
				},
			}),
			read_file: tool({
				description:
					'Read the contents of a given relative file path. Use this when you want to see what is inside a file. Do not use this with directory names.',
				inputSchema: z.object({
					path: z
						.string()
						.describe(
							'The relative path of a file in the working directory.'
						),
				}),
				execute: async ({ path }) => {
					try {
						if (!sandbox) sandbox = await createSandbox(repoUrl)
						const output = readFile(sandbox, path)
						return { path, output }
					} catch (e) {
						console.error('Error reading file', e)
						return { path, error: e }
					}
				},
			}),
			edit_file: tool({
				description:
					'Make edits to a text file or create a new file. Replaces "old_str" with "new_str" in the given file. "old_str" and "new_str" MUST be different from each other. If the file specified with path does not exist, it will be created.',
				inputSchema: z.object({
					path: z.string().describe('The path to the file'),
					old_str: z
						.string()
						.nullish()
						.describe(
							'Text to search for - must be exactly and must only have one match exactly'
						),
					new_str: z
						.string()
						.describe('Text to replace old_str with'),
				}),
				execute: async ({ path, old_str, new_str }) => {
					try {
						if (!sandbox) sandbox = await createSandbox(repoUrl)
						await editFile(sandbox, path, old_str || '', new_str)
						return { success: true }
					} catch (e) {
						console.error(`Error editing file "${path}":`, e)
						return { error: e, success: false }
					}
				},
			}),
			create_pr: tool({
				description:
					"Create a pull request with the current changes. This will add all files, commit changes, push to a new branch, and create a PR using Github's REST API. Use this as the final step when making changes.",
				inputSchema: z.object({
					title: z.string().describe('The title of the pull request'),
					body: z
						.string()
						.describe('The body/description of the pull request'),
					branch: z
						.string()
						.nullable()
						.describe(
							'The name of the branch to create (defaults to a generated name)'
						),
				}),
				execute: async ({ title, body, branch }) => {
					try {
						const { pr_url } = await createPR(sandbox!, repoUrl, {
							title,
							body,
							branch,
						})
						return { success: true, linkToPR: pr_url }
					} catch (e) {
						console.error('Error creating PR:', e)
						return { error: e, success: false }
					}
				},
			}),
		},
		stopWhen: stepCountIs(10),
	})

	if (sandbox) {
		await sandbox.stop()
	}
	return { response: result.text }
}
