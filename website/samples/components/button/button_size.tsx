import React from "react";
import { Button } from "firecms";

export default function ButtonSizeDemo() {
    return (
        <>
            <Button
                size={"small"}
                onClick={() => console.log("Button clicked")}>
                Small
            </Button>
            <Button onClick={() => console.log("Button clicked")}>
                Medium
            </Button>
            <Button
                size={"large"}
                onClick={() => console.log("Button clicked")}>
                Large
            </Button>
        </>
    );
}
