# Doc Checker README

[![Badge for version for Visual Studio Code extension](https://vsmarketplacebadges.dev/version/brian-salas-hache.doc-checker.png?color=blue&style=?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=brian-salas-hache.doc-checker)
[![The MIT license](https://img.shields.io/badge/license-MIT-orange.png?color=blue&style=flat-square)](https://opensource.org/license/mit)
[![GitHub](https://img.shields.io/badge/GitHub-BrianSalasHache-blue?style=flat&logo=github)](https://github.com/BrianSalasHache)




[![BuyMeACoffee](https://www.buymeacoffee.com/assets/img/custom_images/purple_img.png)](https://www.buymeacoffee.com/briansalashache)

**This project is `active`, not sponsored or funded.**

---

### This extension checks for missing or obsolete documentation. It checks the module, classes, methods and functions.

![Example image](https://github.com/user-attachments/assets/a042897b-00fd-46b1-88b1-a3948a82692c)

### I recommend using the [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) extension to view the warnings in this way:
![Example image using Error Lens extension](https://github.com/user-attachments/assets/ca650b98-577a-4146-a828-5d53e072763a)


## 📦 Install

1. Go to `View -> Command Palette`
2. Then enter `Install Extension`
3. Write `doc-checker`
4. Select it or press Enter to install


## 📝 Languages supported

<ul style='list-style-type: none;'>
	<li>
		<details>
			<summary><strong>Python</strong></summary>
			<ul>
				<li>Google</li>
				<li>NumPy</li>
				<li>reST</li>
			</ul>
		</details>		
	</li>
</ul>
<ul style='list-style-type: none;'>
	<li>
		<details>
			<summary><strong>JavaScript/TypeScript</strong></summary>
			<ul>
				<li>Google Closure</li>
				<li>JSDoc</li>
			</ul>
		</details>		
	</li>
</ul>
<ul style='list-style-type: none;'>
	<li>
		<details>
			<summary><strong>Java</strong></summary>
			<ul>
				<li>Javadoc</li>
			</ul>
		</details>		
	</li>
</ul>
<ul style='list-style-type: none;'>
	<li><strong>🚧 More under construction</strong></li>
</ul>


## ⚙️ Settings

> **Doc Checker** extension settings start with `doc-checker.`

| Setting          | Default    | Description                                                                                                           |
|------------------|------------|-----------------------------------------------------------------------------------------------------------------------|
| activateOnChange | **true**   | The extension will be activated when a file is changed.                                                               |
| class            | **true**   | Check that all classes have a docstring.                                                                              |
| debounceDelay    | **300**    | Specifies the delay, in milliseconds, before the checker runs after changes are made when 'modify' mode is activated. |
| function         | **true**   | Check that all functions have updated docstring.                                                                      |
| languages        | **["java", "javascript", "python", "typescript"]** | Specify the languages for which the checker should run.                       |
| method           | **true**   | Check that all methods have updated docstring.                                                                        |
| mode             | **"save"** | Choose when to activate the checker. 'modify' activates on any file modification, 'save' activates on file save.      |
| module           | **true**   | Check that all modules have a docstring.                                                                              |
| parameter        | **true**   | Check that all functions and methods have updated parameters.                                                         |
| return           | **true**   | Check that all functions and methods have updated returns.                                                            |
| throw            | **true**   | Check that all functions and methods have updated throws.                                                             |


## 🤝 Contributing

We welcome contributions to the **Doc Checker**! If you have suggestions for improvements, bug fixes, or new features, please check out our [Contributing Guidelines](./CONTRIBUTING.md) for more details on how to get started.

Your feedback and contributions are invaluable to making this extension better for everyone. Thank you for your interest in contributing! 🙌


## 📜 License

Licensed under [MIT](./LICENSE)

Copyright &copy; 2024+