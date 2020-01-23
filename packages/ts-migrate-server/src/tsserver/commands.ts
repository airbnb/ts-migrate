/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import tsp from 'typescript/lib/protocol';

// Because the `const enum` from 'typescript/lib/protocol' doesn't get inlined with transpile only.
export const CommandTypes = {
  JsxClosingTag: 'jsxClosingTag' as tsp.CommandTypes.JsxClosingTag,
  Brace: 'brace' as tsp.CommandTypes.Brace,
  BraceCompletion: 'braceCompletion' as tsp.CommandTypes.BraceCompletion,
  GetSpanOfEnclosingComment: 'getSpanOfEnclosingComment' as tsp.CommandTypes.GetSpanOfEnclosingComment,
  Change: 'change' as tsp.CommandTypes.Change,
  Close: 'close' as tsp.CommandTypes.Close,
  /** @deprecated Prefer CompletionInfo -- see comment on CompletionsResponse */
  Completions: 'completions' as tsp.CommandTypes.Completions,
  CompletionInfo: 'completionInfo' as tsp.CommandTypes.CompletionInfo,
  CompletionDetails: 'completionEntryDetails' as tsp.CommandTypes.CompletionDetails,
  CompileOnSaveAffectedFileList: 'compileOnSaveAffectedFileList' as tsp.CommandTypes.CompileOnSaveAffectedFileList,
  CompileOnSaveEmitFile: 'compileOnSaveEmitFile' as tsp.CommandTypes.CompileOnSaveEmitFile,
  Configure: 'configure' as tsp.CommandTypes.Configure,
  Definition: 'definition' as tsp.CommandTypes.Definition,
  DefinitionAndBoundSpan: 'definitionAndBoundSpan' as tsp.CommandTypes.DefinitionAndBoundSpan,
  Implementation: 'implementation' as tsp.CommandTypes.Implementation,
  Exit: 'exit' as tsp.CommandTypes.Exit,
  Format: 'format' as tsp.CommandTypes.Format,
  Formatonkey: 'formatonkey' as tsp.CommandTypes.Formatonkey,
  Geterr: 'geterr' as tsp.CommandTypes.Geterr,
  GeterrForProject: 'geterrForProject' as tsp.CommandTypes.GeterrForProject,
  SemanticDiagnosticsSync: 'semanticDiagnosticsSync' as tsp.CommandTypes.SemanticDiagnosticsSync,
  SyntacticDiagnosticsSync: 'syntacticDiagnosticsSync' as tsp.CommandTypes.SyntacticDiagnosticsSync,
  SuggestionDiagnosticsSync: 'suggestionDiagnosticsSync' as tsp.CommandTypes.SuggestionDiagnosticsSync,
  NavBar: 'navbar' as tsp.CommandTypes.NavBar,
  Navto: 'navto' as tsp.CommandTypes.Navto,
  NavTree: 'navtree' as tsp.CommandTypes.NavTree,
  NavTreeFull: 'navtree-full' as tsp.CommandTypes.NavTreeFull,
  /** @deprecated */
  Occurrences: 'occurrences' as tsp.CommandTypes.Occurrences,
  DocumentHighlights: 'documentHighlights' as tsp.CommandTypes.DocumentHighlights,
  Open: 'open' as tsp.CommandTypes.Open,
  Quickinfo: 'quickinfo' as tsp.CommandTypes.Quickinfo,
  References: 'references' as tsp.CommandTypes.References,
  Reload: 'reload' as tsp.CommandTypes.Reload,
  Rename: 'rename' as tsp.CommandTypes.Rename,
  Saveto: 'saveto' as tsp.CommandTypes.Saveto,
  SignatureHelp: 'signatureHelp' as tsp.CommandTypes.SignatureHelp,
  Status: 'status' as tsp.CommandTypes.Status,
  TypeDefinition: 'typeDefinition' as tsp.CommandTypes.TypeDefinition,
  ProjectInfo: 'projectInfo' as tsp.CommandTypes.ProjectInfo,
  ReloadProjects: 'reloadProjects' as tsp.CommandTypes.ReloadProjects,
  Unknown: 'unknown' as tsp.CommandTypes.Unknown,
  OpenExternalProject: 'openExternalProject' as tsp.CommandTypes.OpenExternalProject,
  OpenExternalProjects: 'openExternalProjects' as tsp.CommandTypes.OpenExternalProjects,
  CloseExternalProject: 'closeExternalProject' as tsp.CommandTypes.CloseExternalProject,
  UpdateOpen: 'updateOpen' as tsp.CommandTypes.UpdateOpen,
  GetOutliningSpans: 'getOutliningSpans' as tsp.CommandTypes.GetOutliningSpans,
  TodoComments: 'todoComments' as tsp.CommandTypes.TodoComments,
  Indentation: 'indentation' as tsp.CommandTypes.Indentation,
  DocCommentTemplate: 'docCommentTemplate' as tsp.CommandTypes.DocCommentTemplate,
  CompilerOptionsForInferredProjects: 'compilerOptionsForInferredProjects' as tsp.CommandTypes.CompilerOptionsForInferredProjects,
  GetCodeFixes: 'getCodeFixes' as tsp.CommandTypes.GetCodeFixes,
  GetCombinedCodeFix: 'getCombinedCodeFix' as tsp.CommandTypes.GetCombinedCodeFix,
  ApplyCodeActionCommand: 'applyCodeActionCommand' as tsp.CommandTypes.ApplyCodeActionCommand,
  GetSupportedCodeFixes: 'getSupportedCodeFixes' as tsp.CommandTypes.GetSupportedCodeFixes,
  GetApplicableRefactors: 'getApplicableRefactors' as tsp.CommandTypes.GetApplicableRefactors,
  GetEditsForRefactor: 'getEditsForRefactor' as tsp.CommandTypes.GetEditsForRefactor,
  OrganizeImports: 'organizeImports' as tsp.CommandTypes.OrganizeImports,
  GetEditsForFileRename: 'getEditsForFileRename' as tsp.CommandTypes.GetEditsForFileRename,
  ConfigurePlugin: 'configurePlugin' as tsp.CommandTypes.ConfigurePlugin,
};

export type Commands = {
  [CommandTypes.JsxClosingTag]: {
    request: tsp.JsxClosingTagRequest;
    response: tsp.JsxClosingTagResponse;
  };
  [CommandTypes.Brace]: {
    request: tsp.BraceRequest;
    response: tsp.BraceResponse;
  };
  [CommandTypes.BraceCompletion]: {
    request: tsp.BraceCompletionRequest;
    response: undefined;
  };
  [CommandTypes.GetSpanOfEnclosingComment]: {
    request: tsp.SpanOfEnclosingCommentRequest;
    response: undefined;
  };
  [CommandTypes.Change]: {
    request: tsp.ChangeRequest;
    response: undefined;
  };
  [CommandTypes.Close]: {
    request: tsp.CloseRequest;
    response: undefined;
  };
  [CommandTypes.Completions]: {
    request: tsp.CompletionsRequest;
    response: tsp.CompletionsResponse;
  };
  [CommandTypes.CompletionInfo]: {
    request: tsp.CompletionsRequest;
    response: tsp.CompletionInfoResponse;
  };
  [CommandTypes.CompletionDetails]: {
    request: tsp.CompletionDetailsRequest;
    response: tsp.CompletionDetailsResponse;
  };
  [CommandTypes.CompileOnSaveAffectedFileList]: {
    request: tsp.CompileOnSaveAffectedFileListRequest;
    response: tsp.CompileOnSaveAffectedFileListResponse;
  };
  [CommandTypes.CompileOnSaveEmitFile]: {
    request: tsp.CompileOnSaveEmitFileRequest;
    response: undefined;
  };
  [CommandTypes.Configure]: {
    request: tsp.ConfigureRequest;
    response: tsp.ConfigureResponse;
  };
  [CommandTypes.Definition]: {
    request: tsp.DefinitionRequest;
    response: tsp.DefinitionResponse;
  };
  [CommandTypes.DefinitionAndBoundSpan]: {
    request: tsp.DefinitionAndBoundSpanRequest;
    response: tsp.DefinitionAndBoundSpanResponse;
  };
  [CommandTypes.Implementation]: {
    request: tsp.ImplementationRequest;
    response: tsp.ImplementationResponse;
  };
  [CommandTypes.Exit]: {
    request: tsp.ExitRequest;
    response: undefined;
  };
  [CommandTypes.Format]: {
    request: tsp.FormatRequest;
    response: tsp.FormatResponse;
  };
  [CommandTypes.Formatonkey]: {
    request: tsp.FormatOnKeyRequest;
    response: undefined;
  };
  [CommandTypes.Geterr]: {
    request: tsp.GeterrRequest;
    response: undefined;
  };
  [CommandTypes.GeterrForProject]: {
    request: tsp.GeterrForProjectRequest;
    response: undefined;
  };
  [CommandTypes.SemanticDiagnosticsSync]: {
    request: tsp.SemanticDiagnosticsSyncRequest;
    response: tsp.SemanticDiagnosticsSyncResponse;
  };
  [CommandTypes.SyntacticDiagnosticsSync]: {
    request: tsp.SyntacticDiagnosticsSyncRequest;
    response: tsp.SyntacticDiagnosticsSyncResponse;
  };
  [CommandTypes.SuggestionDiagnosticsSync]: {
    request: tsp.SuggestionDiagnosticsSyncRequest;
    response: tsp.SuggestionDiagnosticsSyncResponse;
  };
  [CommandTypes.NavBar]: {
    request: tsp.NavBarRequest;
    response: tsp.NavBarResponse;
  };
  [CommandTypes.Navto]: {
    request: tsp.NavtoRequest;
    response: tsp.NavtoResponse;
  };
  [CommandTypes.NavTree]: {
    request: tsp.NavTreeRequest;
    response: tsp.NavTreeResponse;
  };
  [CommandTypes.NavTreeFull]: {
    request: undefined;
    response: undefined;
  };
  [CommandTypes.Occurrences]: {
    request: tsp.OccurrencesRequest;
    response: tsp.OccurrencesResponse;
  };
  [CommandTypes.DocumentHighlights]: {
    request: tsp.DocumentHighlightsRequest;
    response: tsp.DocumentHighlightsResponse;
  };
  [CommandTypes.Open]: {
    request: tsp.OpenRequest;
    response: undefined;
  };
  [CommandTypes.Quickinfo]: {
    request: tsp.QuickInfoRequest;
    response: tsp.QuickInfoResponse;
  };
  [CommandTypes.References]: {
    request: tsp.ReferencesRequest;
    response: tsp.ReferencesResponse;
  };
  [CommandTypes.Reload]: {
    request: tsp.ReloadRequest;
    response: tsp.ReloadResponse;
  };
  [CommandTypes.Rename]: {
    request: tsp.RenameRequest;
    response: tsp.RenameResponse;
  };
  [CommandTypes.Saveto]: {
    request: tsp.SavetoRequest;
    response: undefined;
  };
  [CommandTypes.SignatureHelp]: {
    request: tsp.SignatureHelpRequest;
    response: tsp.SignatureHelpResponse;
  };
  [CommandTypes.Status]: {
    request: tsp.StatusRequest;
    response: tsp.StatusResponse;
  };
  [CommandTypes.TypeDefinition]: {
    request: tsp.TypeDefinitionRequest;
    response: tsp.TypeDefinitionResponse;
  };
  [CommandTypes.ProjectInfo]: {
    request: tsp.ProjectInfoRequest;
    response: tsp.ProjectInfoResponse;
  };
  [CommandTypes.ReloadProjects]: {
    request: tsp.ReloadProjectsRequest;
    response: undefined;
  };
  [CommandTypes.Unknown]: {
    request: undefined;
    response: undefined;
  };
  [CommandTypes.OpenExternalProject]: {
    request: tsp.OpenExternalProjectRequest;
    response: tsp.OpenExternalProjectResponse;
  };
  [CommandTypes.OpenExternalProjects]: {
    request: tsp.OpenExternalProjectsRequest;
    response: tsp.OpenExternalProjectsResponse;
  };
  [CommandTypes.CloseExternalProject]: {
    request: tsp.CloseExternalProjectRequest;
    response: tsp.CloseExternalProjectResponse;
  };
  [CommandTypes.UpdateOpen]: {
    request: tsp.UpdateOpenRequest;
    response: undefined;
  };
  [CommandTypes.GetOutliningSpans]: {
    request: tsp.OutliningSpansRequest;
    response: tsp.OutliningSpansResponse;
  };
  [CommandTypes.TodoComments]: {
    request: tsp.TodoCommentRequest;
    response: tsp.TodoCommentsResponse;
  };
  [CommandTypes.Indentation]: {
    request: tsp.IndentationRequest;
    response: tsp.IndentationResponse;
  };
  [CommandTypes.DocCommentTemplate]: {
    request: tsp.DocCommentTemplateRequest;
    response: tsp.DocCommandTemplateResponse;
  };
  [CommandTypes.CompilerOptionsForInferredProjects]: {
    request: tsp.SetCompilerOptionsForInferredProjectsRequest;
    response: undefined;
  };
  [CommandTypes.GetCodeFixes]: {
    request: tsp.CodeFixRequest;
    response: tsp.GetCodeFixesResponse;
  };
  [CommandTypes.GetCombinedCodeFix]: {
    request: tsp.GetCombinedCodeFixRequest;
    response: tsp.GetCombinedCodeFixResponse;
  };
  [CommandTypes.ApplyCodeActionCommand]: {
    request: tsp.ApplyCodeActionCommandRequest;
    response: tsp.ApplyCodeActionCommandResponse;
  };
  [CommandTypes.GetSupportedCodeFixes]: {
    request: tsp.GetSupportedCodeFixesRequest;
    response: tsp.GetSupportedCodeFixesResponse;
  };
  [CommandTypes.GetApplicableRefactors]: {
    request: tsp.GetApplicableRefactorsRequest;
    response: tsp.GetApplicableRefactorsResponse;
  };
  [CommandTypes.GetEditsForRefactor]: {
    request: tsp.GetEditsForRefactorRequest;
    response: tsp.GetEditsForRefactorResponse;
  };
  [CommandTypes.OrganizeImports]: {
    request: tsp.OrganizeImportsRequest;
    response: tsp.OrganizeImportsResponse;
  };
  [CommandTypes.GetEditsForFileRename]: {
    request: tsp.GetEditsForFileRenameRequest;
    response: tsp.GetEditsForFileRenameResponse;
  };
  [CommandTypes.ConfigurePlugin]: {
    request: tsp.ConfigurePluginRequest;
    response: tsp.ConfigurePluginResponse;
  };
};

// @ts-ignore ts-migrate(2536) FIXME: Type 'C' cannot be used to index type 'Commands'.
export type CommandRequest<C extends tsp.CommandTypes> = Commands[C]['request'];

type CommandArgsHelper<T> = T extends { arguments?: any } ? T['arguments'] : undefined;
export type CommandArgs<C extends tsp.CommandTypes> = CommandArgsHelper<CommandRequest<C>>;

// @ts-ignore ts-migrate(2536) FIXME: Type 'C' cannot be used to index type 'Commands'.
export type CommandResponse<C extends tsp.CommandTypes> = Commands[C]['response'];

type CommandBodyHelper<T> = T extends { body?: any } ? T['body'] : undefined;
export type CommandBody<C extends tsp.CommandTypes> = CommandBodyHelper<CommandResponse<C>>;

const COMMAND_HAS_RESPONSE: {
  [K in keyof Commands]: Commands[K]['response'] extends undefined ? false : true;
} = {
  [CommandTypes.JsxClosingTag]: true,
  [CommandTypes.Brace]: true,
  [CommandTypes.BraceCompletion]: false,
  [CommandTypes.GetSpanOfEnclosingComment]: false,
  [CommandTypes.Change]: false,
  [CommandTypes.Close]: false,
  [CommandTypes.Completions]: true,
  [CommandTypes.CompletionInfo]: true,
  [CommandTypes.CompletionDetails]: true,
  [CommandTypes.CompileOnSaveAffectedFileList]: true,
  [CommandTypes.CompileOnSaveEmitFile]: false,
  [CommandTypes.Configure]: true,
  [CommandTypes.Definition]: true,
  [CommandTypes.DefinitionAndBoundSpan]: true,
  [CommandTypes.Implementation]: true,
  [CommandTypes.Exit]: false,
  [CommandTypes.Format]: true,
  [CommandTypes.Formatonkey]: false,
  [CommandTypes.Geterr]: false,
  [CommandTypes.GeterrForProject]: false,
  [CommandTypes.SemanticDiagnosticsSync]: true,
  [CommandTypes.SyntacticDiagnosticsSync]: true,
  [CommandTypes.SuggestionDiagnosticsSync]: true,
  [CommandTypes.NavBar]: true,
  [CommandTypes.Navto]: true,
  [CommandTypes.NavTree]: true,
  [CommandTypes.NavTreeFull]: false,
  [CommandTypes.Occurrences]: true,
  [CommandTypes.DocumentHighlights]: true,
  [CommandTypes.Open]: false,
  [CommandTypes.Quickinfo]: true,
  [CommandTypes.References]: true,
  [CommandTypes.Reload]: true,
  [CommandTypes.Rename]: true,
  [CommandTypes.Saveto]: false,
  [CommandTypes.SignatureHelp]: true,
  [CommandTypes.Status]: true,
  [CommandTypes.TypeDefinition]: true,
  [CommandTypes.ProjectInfo]: true,
  [CommandTypes.ReloadProjects]: false,
  [CommandTypes.Unknown]: false,
  [CommandTypes.OpenExternalProject]: true,
  [CommandTypes.OpenExternalProjects]: true,
  [CommandTypes.CloseExternalProject]: true,
  [CommandTypes.UpdateOpen]: false,
  [CommandTypes.GetOutliningSpans]: true,
  [CommandTypes.TodoComments]: true,
  [CommandTypes.Indentation]: true,
  [CommandTypes.DocCommentTemplate]: true,
  [CommandTypes.CompilerOptionsForInferredProjects]: false,
  [CommandTypes.GetCodeFixes]: true,
  [CommandTypes.GetCombinedCodeFix]: true,
  [CommandTypes.ApplyCodeActionCommand]: true,
  [CommandTypes.GetSupportedCodeFixes]: true,
  [CommandTypes.GetApplicableRefactors]: true,
  [CommandTypes.GetEditsForRefactor]: true,
  [CommandTypes.OrganizeImports]: true,
  [CommandTypes.GetEditsForFileRename]: true,
  [CommandTypes.ConfigurePlugin]: true,
};

export function commandHasResponse(command: tsp.CommandTypes): boolean {
  // @ts-ignore ts-migrate(7053) FIXME: Property '[CommandTypes.SelectionRange]' does not ... Remove this comment to see the full error message
  return COMMAND_HAS_RESPONSE[command];
}
