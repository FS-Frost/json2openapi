<script lang="ts">
    import example from "$lib/example.json";
    import { onMount } from "svelte";
    import Editor from "../Editor.svelte";
    import { parseObject } from "$lib/json2openapi";

    const title: string = "JSON-2-OpenAPI";

    let editor = $state<Editor>();
    let editorOpenApi = $state<Editor>();
    let errorMessage = $state<string>("");

    function updateCode(code: string): void {
        let json: unknown = {};

        try {
            json = JSON.parse(code);
        } catch (error) {
            errorMessage = `ERROR: ${error}`;
            console.error(errorMessage);
            editorOpenApi?.setValue(`// ${errorMessage}`);
            return;
        }

        try {
            const result = parseObject(json) ?? {};
            editorOpenApi?.setValue(JSON.stringify(result, null, 2));
        } catch (error) {
            errorMessage = `ERROR: translating to OpenAPI: ${error}`;
            console.error(errorMessage);
            editorOpenApi?.setValue(`// ${errorMessage}`);
            return;
        }

        errorMessage = "";
    }

    function formatSourceCode(): void {
        try {
            let code = editor?.getCurrentValue() ?? "";
            updateCode(code);

            if (errorMessage != "") {
                alert(errorMessage);
                return;
            }

            code = JSON.stringify(JSON.parse(code), null, 2);
            editor?.setValue(code);
        } catch (error) {
            console.error("failed to format source code", error);
        }
    }

    function showSourceExample(): void {
        const initialCode = JSON.stringify(example, null, 2);
        editor?.setValue(initialCode);
        updateCode(initialCode);
    }

    onMount(async () => {
        let editorInitError = (await editor?.init()) ?? "";
        if (editorInitError.length > 0) {
            errorMessage = `ERROR: ${editorInitError}`;
            console.log(errorMessage);
            editorOpenApi?.setValue(`// ${errorMessage}`);
            return;
        }

        editorInitError = (await editorOpenApi?.init()) ?? "";
        if (editorInitError.length > 0) {
            errorMessage = `ERROR: ${editorInitError}`;
            console.error(errorMessage);
            editorOpenApi?.setValue(`// ${errorMessage}`);
            return;
        }

        showSourceExample();
    });
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<h1>{title}</h1>

<p class="has-text-danger">{errorMessage}&nbsp;</p>

<div class="langs">
    <div class="lang">
        <label class="label" for="">JSON</label>
        <Editor
            bind:this={editor}
            lang="rust"
            minimapEnabled={false}
            readonly={false}
            value=""
            onChange={(detail) => updateCode(detail)}
        />

        <button class="button is-link" onclick={() => formatSourceCode()}>
            Format JSON
        </button>

        <button class="button is-link" onclick={() => showSourceExample()}>
            Show example
        </button>
    </div>

    <div class="lang">
        <label class="label" for="">OpenAPI</label>
        <Editor
            bind:this={editorOpenApi}
            value=""
            minimapEnabled={false}
            lang="go"
            readonly
        />
    </div>
</div>

<style>
    label {
        width: 100%;
        text-align: center;
    }

    p {
        width: 100%;
    }

    .langs {
        display: flex;
        width: 100%;
    }

    .lang {
        width: 100%;
        justify-content: space-evenly;
    }

    .lang button {
        width: 10rem;
    }
</style>
